import {
  LoginResponse,
  ReolinkCommand,
  ReolinkResponse,
} from './types';
import {
  ReolinkAuthenticationError,
  ReolinkError,
  ReolinkTimeoutError,
} from './errors';

type ReolinkTransportOptions = {
  host: string;
  username: string;
  password: string;
  channel: number;
  port: number;
  https: boolean;
  timeoutMs: number;
};

export class ReolinkTransport {
  private readonly baseUrl: string;

  private token: string | null = null;
  private tokenExpiresAt = 0;
  private loginPromise: Promise<void> | null = null;

  constructor(
    private readonly options: ReolinkTransportOptions,
  ) {
    const protocol = options.https ? 'https' : 'http';

    this.baseUrl = `${protocol}://${options.host}:${options.port}/cgi-bin/api.cgi`;
  }

  async execute<T>(
    command: ReolinkCommand,
  ): Promise<T> {
    await this.ensureAuthenticated();

    const requestToken = this.token;

    try {
      return await this.send<T>(command, true);
    } catch (error) {
      if (!this.isAuthenticationFailure(error)) {
        throw error;
      }

      // Only invalidate the token used by this request. Another request may
      // already have refreshed it while this response was in flight.
      if (this.token === requestToken) {
        this.token = null;
        this.tokenExpiresAt = 0;
      }

      await this.ensureAuthenticated();
      return this.send<T>(command, true);
    }
  }

  async logout(): Promise<void> {
    if (!this.token) {
      return;
    }

    try {
      await this.send<unknown>(
        {
          cmd: 'Logout',
          action: 0,
          param: {},
        },
        true,
      );
    } finally {
      this.token = null;
      this.tokenExpiresAt = 0;
    }
  }

  private async login(): Promise<void> {
    const command: ReolinkCommand = {
      cmd: 'Login',
      action: 0,
      param: {
        User: {
          userName: this.options.username,
          password: this.options.password,
        },
      },
    };

    const response = await this.send<LoginResponse>(
      command,
      false,
    );

    const token = response.Token?.name;

    if (!token) {
      throw new ReolinkAuthenticationError();
    }

    this.token = token;

    const leaseSeconds = Number(response.Token.leaseTime);
    const leaseTimeMs = Number.isFinite(leaseSeconds) && leaseSeconds > 0
      ? leaseSeconds * 1000
      : 3_600_000;
    const refreshMarginMs = Math.min(60_000, leaseTimeMs * 0.1);
    this.tokenExpiresAt = Date.now() + leaseTimeMs - refreshMarginMs;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (
      this.token &&
      Date.now() < this.tokenExpiresAt
    ) {
      return;
    }

    if (!this.loginPromise) {
      this.loginPromise = this.login().finally(() => {
        this.loginPromise = null;
      });
    }

    await this.loginPromise;
  }

  private isAuthenticationFailure(error: unknown): boolean {
    return error instanceof ReolinkError &&
      (error.code === -6 || error.code === -21 || error.code === 401 || error.code === 403);
  }

  private async send<T>(
    command: ReolinkCommand,
    authenticated: boolean,
  ): Promise<T> {
    const requestCommand: ReolinkCommand = {
      ...command,
      param: {
        channel: this.options.channel,
        ...command.param,
      },
    };
    const url = new URL(this.baseUrl);

    url.searchParams.set('cmd', requestCommand.cmd);

    if (authenticated && this.token) {
      url.searchParams.set('token', this.token);
    }

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs,
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([requestCommand]),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ReolinkError(
          `HTTP request failed with status ${response.status}`,
          response.status,
          command.cmd,
        );
      }

      const data =
        (await response.json()) as ReolinkResponse<T>[];

      const result = data[0];

      if (!result) {
        throw new ReolinkError(
          'Reolink returned an empty response',
          undefined,
          command.cmd,
        );
      }

      if (result.code !== 0) {
        throw new ReolinkError(
          result.error?.detail ??
            `Reolink command "${command.cmd}" failed`,
          result.error?.rspCode ?? result.code,
          command.cmd,
        );
      }

      return result.value as T;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        throw new ReolinkTimeoutError(command.cmd);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

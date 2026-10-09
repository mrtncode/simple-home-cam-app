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

    return this.send<T>(command, true);
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

    const leaseTimeMs =
      (response.Token.leaseTime || 3600) * 1000;

    // Refresh one minute before the token expires.
    this.tokenExpiresAt =
      Date.now() + leaseTimeMs - 60_000;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (
      this.token &&
      Date.now() < this.tokenExpiresAt
    ) {
      return;
    }

    await this.login();
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

    console.log("Sending Reolink command:", requestCommand, "URL:", url.toString() + "Channel and IP:", this.options.host, "Port:", this.options.port, "HTTPS:", this.options.https, "channel", requestCommand.param.channel);
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
          result.code,
          command.cmd,
        );
      }

      return result.value as T;
    } catch (error) {
      if (
        error instanceof DOMException &&
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
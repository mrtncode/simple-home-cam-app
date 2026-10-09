import { DetectionCommands } from './commands/detection';
import { LightCommands } from './commands/light';
import { PtzCommands } from './commands/ptz';
import { SirenCommands } from './commands/siren';
import { ReolinkTransport } from './transport';
import { ReolinkClientOptions } from './types';

export class ReolinkClient {
  private readonly transport: ReolinkTransport;

  readonly ptz: PtzCommands;
  readonly siren: SirenCommands;
  readonly light: LightCommands;
  readonly detection: DetectionCommands;

  constructor(options: ReolinkClientOptions) {
    const channel = options.channel ?? 0; // Use channel for camera connected over a hub, for standalone cameras, channel is always 0?

    this.transport = new ReolinkTransport({
      host: options.host,
      username: options.username,
      password: options.password,
      channel,
      port: options.port ?? (options.https ? 443 : 80),
      https: options.https ?? false,
      timeoutMs: options.timeoutMs ?? 10_000,
    });

    this.ptz = new PtzCommands(
      this.transport,
      channel,
    );

    this.siren = new SirenCommands(
      this.transport,
      channel,
    );

    this.light = new LightCommands(
      this.transport,
      channel,
    );

    this.detection = new DetectionCommands(
      this.transport,
      channel,
    );
  }

  async logout(): Promise<void> {
    await this.transport.logout();
  }
}
import { ReolinkTransport } from '../transport';
import {
  LightState,
  WhiteLedResponse,
} from '../types';

export type LightUpdate = {
  enabled?: boolean;
  brightness?: number;
};

export class LightCommands {
  constructor(
    private readonly transport: ReolinkTransport,
    private readonly channel: number,
  ) {}

  async get(): Promise<LightState> {
    const response =
      await this.transport.execute<WhiteLedResponse>({
        cmd: 'GetWhiteLed',
        action: 0,
        param: {
          channel: this.channel,
        },
      });

    return {
      enabled: response.WhiteLed.state === 1,
      brightness: response.WhiteLed.bright ?? 0,
    };
  }

  async set(update: LightUpdate): Promise<void> {
    if (
      update.brightness !== undefined &&
      (update.brightness < 0 ||
        update.brightness > 100)
    ) {
      throw new RangeError(
        'Light brightness must be between 0 and 100',
      );
    }

    await this.transport.execute({
      cmd: 'SetWhiteLed',
      action: 0,
      param: {
        WhiteLed: {
          channel: this.channel,

          ...(update.enabled !== undefined && {
            state: update.enabled ? 1 : 0,
          }),

          ...(update.brightness !== undefined && {
            bright: update.brightness,
          }),
        },
      },
    });
  }

  async turnOn(): Promise<void> {
    await this.set({
      enabled: true,
    });
  }

  async turnOff(): Promise<void> {
    await this.set({
      enabled: false,
    });
  }

  async setBrightness(
    brightness: number,
  ): Promise<void> {
    await this.set({
      brightness,
    });
  }
}
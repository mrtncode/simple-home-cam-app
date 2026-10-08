import { ReolinkTransport } from '../transport';
import {
  PtzPreset,
  PtzPresetResponse,
} from '../types';

export class PtzCommands {
  constructor(
    private readonly transport: ReolinkTransport,
    private readonly channel: number,
  ) {}

  async getPresets(): Promise<PtzPreset[]> {
    const response =
      await this.transport.execute<PtzPresetResponse>({
        cmd: 'GetPtzPreset',
        action: 1,
        param: {
          channel: this.channel,
        },
      });

    return response.PtzPreset
      .filter((preset) => preset.enable === 1)
      .map((preset) => ({
        id: Number(preset.id),
        name: preset.name,
        enabled: true,
      }));
  }

  async gotoPreset(
    presetId: number,
    speed = 60,
  ): Promise<void> {
    await this.transport.execute({
      cmd: 'PtzCtrl',
      action: 0,
      param: {
        channel: this.channel,
        op: 'ToPos',
        speed,
        id: presetId,
      },
    });
  }

  async createPreset(
    presetId: number,
    name: string,
  ): Promise<void> {
    await this.transport.execute({
      cmd: 'SetPtzPreset',
      action: 0,
      param: {
        PtzPreset: {
          channel: this.channel,
          enable: 1,
          id: presetId,
          name,
        },
      },
    });
  }

  async deletePreset(
    presetId: number,
    name: string,
  ): Promise<void> {
    await this.transport.execute({
      cmd: 'SetPtzPreset',
      action: 0,
      param: {
        PtzPreset: {
          channel: this.channel,
          enable: 0,
          id: presetId,
          name,
        },
      },
    });
  }
}
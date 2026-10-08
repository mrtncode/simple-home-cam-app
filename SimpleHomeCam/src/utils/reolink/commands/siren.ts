import { ReolinkTransport } from '../transport';

export class SirenCommands {
  constructor(
    private readonly transport: ReolinkTransport,
    private readonly channel: number,
  ) {}

  async set(enabled: boolean): Promise<void> {
    await this.transport.execute({
      cmd: 'AudioAlarmPlay',
      action: 0,
      param: {
        channel: this.channel,
        alarm_mode: 'manu',
        manual_switch: enabled ? 1 : 0,
      },
    });
  }

  async turnOn(): Promise<void> {
    await this.set(true);
  }

  async turnOff(): Promise<void> {
    await this.set(false);
  }
}
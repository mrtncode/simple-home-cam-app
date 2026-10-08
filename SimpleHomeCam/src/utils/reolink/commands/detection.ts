import { ReolinkTransport } from '../transport';
import {
  AiStateResponse,
  DetectionState,
  MotionStateResponse,
} from '../types';

export class DetectionCommands {
  constructor(
    private readonly transport: ReolinkTransport,
    private readonly channel: number,
  ) {}

  async getMotion(): Promise<boolean> {
    const response =
      await this.transport.execute<MotionStateResponse>({
        cmd: 'GetMdState',
        action: 0,
        param: {
          channel: this.channel,
        },
      });

    return response.state === 1;
  }

  async getPerson(): Promise<boolean> {
    const response =
      await this.transport.execute<AiStateResponse>({
        cmd: 'GetAiState',
        action: 0,
        param: {
          channel: this.channel,
        },
      });

    return response.ai?.person === 1;
  }

  async getState(): Promise<DetectionState> {
    const [motion, person] =
      await Promise.all([
        this.getMotion(),
        this.getPerson(),
      ]);

    return {
      motion,
      person,
    };
  }
}
export { ReolinkClient } from './ReolinkClient';

export {
  ReolinkError,
  ReolinkAuthenticationError,
  ReolinkTimeoutError,
} from './errors';

export type {
  ReolinkClientOptions,
  ReolinkDeviceType,
  PtzPreset,
  LightState,
  DetectionState,
} from './types';

export type {
  LightUpdate,
} from './commands/light';
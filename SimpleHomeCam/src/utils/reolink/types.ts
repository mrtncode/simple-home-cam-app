export type ReolinkDeviceType = 'standalone' | 'hub';

export type ReolinkClientOptions = {
  host: string;
  username: string;
  password: string;

  /**
   * Use a channel for Home Hub / NVR devices.
   * Standalone cameras normally use channel 0.
   */
  channel?: number;

  port?: number;
  https?: boolean;
  timeoutMs?: number;
};

export type PtzPreset = {
  id: number;
  name: string;
  enabled: boolean;
};

export type LightState = {
  enabled: boolean;
  brightness: number;
};

export type DetectionState = {
  motion: boolean;
  person: boolean;
};

export type ReolinkCommand = {
  cmd: string;
  action?: number;
  param: Record<string, unknown>;
};

export type ReolinkResponse<T = unknown> = {
  cmd: string;
  code: number;
  value?: T;
  error?: {
    rspCode: number;
    detail: string;
  };
};

export type LoginResponse = {
  Token: {
    name: string;
    leaseTime: number;
  };
};

export type PtzPresetResponse = {
  PtzPreset: Array<{
    id: number;
    name: string;
    enable: number;
  }>;
};

export type WhiteLedResponse = {
  WhiteLed: {
    state: number;
    bright?: number;
  };
};

export type MotionStateResponse = {
  state: number;
};

export type AiStateResponse = {
  ai?: {
    person?: number;
    vehicle?: number;
    dog_cat?: number;
    face?: number;
    package?: number;
  };

  [key: string]: unknown;
};
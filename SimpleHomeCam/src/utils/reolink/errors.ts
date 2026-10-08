export class ReolinkError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly command?: string,
  ) {
    super(message);

    this.name = 'ReolinkError';
  }
}

export class ReolinkAuthenticationError extends ReolinkError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'ReolinkAuthenticationError';
  }
}

export class ReolinkTimeoutError extends ReolinkError {
  constructor(command?: string) {
    super('Request timed out', undefined, command);
    this.name = 'ReolinkTimeoutError';
  }
}
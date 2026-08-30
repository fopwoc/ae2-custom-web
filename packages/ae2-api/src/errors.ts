import type { ZodError } from "zod";

export class Ae2ApiError extends Error {
  constructor(
    public readonly status: string,
    public readonly data: unknown = null,
    options?: ErrorOptions,
  ) {
    super(status, options);
    this.name = "Ae2ApiError";
  }
}

export class Ae2TransportError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "Ae2TransportError";
  }
}

export class Ae2ContractError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly validationError: ZodError,
    options?: ErrorOptions,
  ) {
    super(`AE2 returned an unexpected response for ${endpoint}`, options);
    this.name = "Ae2ContractError";
  }
}

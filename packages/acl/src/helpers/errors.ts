import { Codes, StatusCodes } from '../enums';

export class CustomError extends Error {
  statusCode: number;
  message: string;
  errors: string[];
  date: Date;

  constructor({ statusCode = 422, message = 'Unprocessable Content', errors = [] } = {}) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.date = new Date();
  }
}

export function mapCodeToMessage(code: string) {
  switch (code) {
    case Codes.Success:
      return 'OK';
    case Codes.Created:
      return 'Created';
    case Codes.BadRequest:
      return 'Bad Request';
    case Codes.Forbidden:
      return 'Forbidden';
    case Codes.NotFound:
      return 'Not Found';
    default:
      return;
  }
}

export function mapCodeToStatusCode(code: string) {
  switch (code) {
    case Codes.Success:
      return StatusCodes.OK;
    case Codes.Created:
      return StatusCodes.Created;
    case Codes.BadRequest:
      return StatusCodes.BadRequest;
    case Codes.Forbidden:
      return StatusCodes.Forbidden;
    case Codes.NotFound:
      return StatusCodes.NotFound;
    default:
      return StatusCodes.UnprocessableContent;
  }
}

export function handleResultError({
  success,
  code,
  errors = [],
}: {
  success: boolean;
  code?: string;
  errors?: string[];
}) {
  if (success) return;

  switch (code) {
    case Codes.BadRequest:
      throw new CustomError({ statusCode: StatusCodes.BadRequest, message: 'Bad Request', errors });
    case Codes.Forbidden:
      throw new CustomError({ statusCode: StatusCodes.Forbidden, message: 'Forbidden', errors });
    case Codes.NotFound:
      throw new CustomError({ statusCode: StatusCodes.NotFound, message: 'Not Found', errors });
    default:
      throw new CustomError();
  }
}

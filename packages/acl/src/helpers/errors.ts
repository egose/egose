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

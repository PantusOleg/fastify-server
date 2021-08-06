import { FastifyReply } from "fastify";

const BAD_REQUEST = "Bad request";
const UNAUTHORIZED = "Unauthorized";
const FORBIDDEN = "Forbidden";
const NOT_FOUND = "Not found";

const codes: Record<string, number> = {
  [BAD_REQUEST]: 400,
  [UNAUTHORIZED]: 401,
  [FORBIDDEN]: 403,
  [NOT_FOUND]: 404,
};

class FsError extends Error {
  name: string;
  message: string;
  constructor(name: string, message: string) {
    super(message);
    this.name = name;
    this.message = message;
  }
}

export class NotFoundError extends FsError {
  constructor(message = NOT_FOUND) {
    super(NOT_FOUND, message);
  }
}

export class ForbiddenError extends FsError {
  constructor(message = FORBIDDEN) {
    super(FORBIDDEN, message);
  }
}

export class BadRequestError extends FsError {
  constructor(message = BAD_REQUEST) {
    super(BAD_REQUEST, message);
  }
}

export class UnauthorizedError extends FsError {
  constructor(message = UNAUTHORIZED) {
    super(UNAUTHORIZED, message);
  }
}

type H = (error: FsError, reply: FastifyReply) => void;

export const errorHandler: H = (error, reply) => {
  const code = codes[error.name] ?? 500;
  console.log(error.message);
  reply
    .status(reply.statusCode === 500 ? code : reply.statusCode)
    .type("text/plain")
    .send(error.message);
};

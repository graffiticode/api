const { isNonEmptyString } = require('./util');

function handleErrorForHTTP(res, err) {
  if (err instanceof NotFoundError) {
    res.status(404).send(err.message);
  } else if (err instanceof InvalidArgumentError) {
    res.status(400).send(err.message);
  } else {
    let msg;
    if (err instanceof Error) {
      msg = err.message;
    } else if (isNonEmptyString(err)) {
      msg = err;
    }
    if (isNonEmptyString(msg)) {
      res.status(500).send(msg);
    } else {
      res.sendStatus(500);
    }
  }
}
exports.handleErrorForHTTP = handleErrorForHTTP;

class NotFoundError extends Error {
  constructor(message) {
    super(message);
  }
}
exports.NotFoundError = NotFoundError;

class InvalidArgumentError extends Error {
  constructor(message) {
    super(message);
  }
}
exports.InvalidArgumentError = InvalidArgumentError;

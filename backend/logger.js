const crypto = require('crypto');

function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  const startedAt = Date.now();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const entry = {
      type: 'http_request',
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    };
    const write = res.statusCode >= 500 ? console.error : console.log;
    write(JSON.stringify(entry));
  });

  next();
}

function errorLogger(error, req, res, next) {
  console.error(JSON.stringify({
    type: 'unhandled_error',
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    message: error.message,
    stack: error.stack,
  }));
  next(error);
}

function registerProcessLogging() {
  process.on('unhandledRejection', reason => {
    console.error(JSON.stringify({
      type: 'unhandled_rejection',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    }));
  });

  process.on('uncaughtException', error => {
    console.error(JSON.stringify({
      type: 'uncaught_exception',
      message: error.message,
      stack: error.stack,
    }));
  });
}

module.exports = { errorLogger, registerProcessLogging, requestLogger };

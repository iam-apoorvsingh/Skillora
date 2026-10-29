/**
 * middleware/errorHandler.js — Centralised Error Handler
 * ────────────────────────────────────────────────────────
 * WHY centralised error handling?
 *   Without a centralised handler, each controller must repeat try/catch
 *   boilerplate and format error responses inconsistently. A single Express
 *   error-handling middleware (4-arg signature: err, req, res, next) catches
 *   all errors thrown or passed via next(err) from any route.
 *
 * EXPRESS ERROR HANDLER SIGNATURE:
 *   The 4-argument signature (err, req, res, next) is how Express
 *   identifies an error-handling middleware. Order matters — this MUST be
 *   the LAST app.use() call after all routes are registered.
 */

/**
 * errorHandler
 * @param {Error}    err
 * @param {Request}  req
 * @param {Response} res
 * @param {Function} next - must be declared even if unused (Express 4 quirk)
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    // Log the full stack trace in development for debugging
    if (process.env.NODE_ENV !== 'production') {
        console.error('[ErrorHandler]', err.stack || err.message);
    }

    // Handle SQLite constraint violations
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
            success: false,
            error:   'CONFLICT',
            message: 'A record with this information already exists.',
        });
    }

    if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
        return res.status(422).json({
            success: false,
            error:   'CONSTRAINT_VIOLATION',
            message: 'The provided data violates a database constraint.',
            detail:  err.message,
        });
    }

    // Validation errors from express-validator (passed via next(err))
    if (err.type === 'VALIDATION_ERROR') {
        return res.status(422).json({
            success: false,
            error:   'VALIDATION_ERROR',
            message: 'Request validation failed.',
            errors:  err.errors,
        });
    }

    // Default: Internal Server Error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error:   err.code || 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred. Please try again.',
    });
}

/**
 * notFoundHandler
 * Catches all requests to undefined routes.
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error:   'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} does not exist.`,
    });
}

module.exports = { errorHandler, notFoundHandler };

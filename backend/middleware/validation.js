const validateFeedbackRequest = (req, res, next) => {
  const { description, location, userEmail } = req.body;

  const errors = [];

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }

  if (description && description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    errors.push('Location is required and must be a non-empty string');
  }

  if (userEmail && !isValidEmail(userEmail)) {
    errors.push('Email must be a valid email address');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  req.body.description = description.trim();
  req.body.location = location.trim();
  if (userEmail) {
    req.body.userEmail = userEmail.trim();
  }

  next();
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request body too large'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
};

module.exports = {
  validateFeedbackRequest,
  errorHandler,
  requestLogger
};
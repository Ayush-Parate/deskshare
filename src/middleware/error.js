exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';
  if (err.name === 'CastError') { status = 400; message = 'Invalid id'; }
  if (err.code === 11000) { status = 409; message = 'Duplicate value: ' + Object.keys(err.keyValue).join(', '); }
  if (err.name === 'ValidationError') status = 400;
  if (err.name === 'MulterError' || /Only image files/.test(message)) status = 400;
  if (err.code && String(err.code).startsWith('auth/')) { status = 401; message = 'Invalid Firebase token'; }
  if (status === 500) console.error(err);
  res.status(status).json({ message });
};

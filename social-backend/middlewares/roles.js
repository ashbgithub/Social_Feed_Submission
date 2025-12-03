module.exports = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauth' });

  if (allowedRoles.includes(req.user.role)) return next();

  return res.status(403).json({ error: 'Forbidden' });
};

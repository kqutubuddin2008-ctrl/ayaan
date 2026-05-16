import jwt from 'jsonwebtoken';

export function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) return response.status(401).json({ message: 'Missing authentication token' });

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    return next();
  } catch (_error) {
    return response.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireAdmin(request, response, next) {
  if (request.user?.role !== 'admin') return response.status(403).json({ message: 'Admin access required' });
  return next();
}

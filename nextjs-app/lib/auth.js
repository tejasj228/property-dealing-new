import jwt from 'jsonwebtoken';

/**
 * Verify a JWT token from the Authorization header.
 * Returns { admin } on success, { error, status } on failure.
 */
export function authenticateToken(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { error: 'Access denied. No token provided.', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { admin: decoded };
  } catch (error) {
    return { error: 'Invalid or expired token.', status: 403 };
  }
}

/**
 * Check that the authenticated user has the admin role.
 * Call after authenticateToken.
 */
export function requireAdmin(admin) {
  if (!admin || admin.role !== 'admin') {
    return { error: 'Access denied. Admin privileges required.', status: 403 };
  }
  return { ok: true };
}

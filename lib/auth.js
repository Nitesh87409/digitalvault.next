import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
}

export function generateToken(payload, expiresIn = '30d') {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (e) {
    return null;
  }
}

// Get token from request headers
export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim() || null;
  }
  return authHeader.trim() || null;
}

// Verify admin from request
export function verifyAdmin(request) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.role === 'admin' ? decoded : null;
}

// Verify customer from request
export function verifyCustomer(request) {
  const token = request.cookies.get('dv_token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role === 'admin') return null;
  return decoded;
}

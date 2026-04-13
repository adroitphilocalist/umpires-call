import jwt from 'jsonwebtoken';

const SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';
const EXPIRY = '7d';

export function createToken(payload: { userId: string; phone: string; email: string; displayName: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as { userId: string; phone: string; email: string; displayName: string };
  } catch {
    return null;
  }
}

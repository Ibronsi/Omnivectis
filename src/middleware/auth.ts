import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  userUid?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim();
  } else if (typeof req.query.idToken === 'string' && req.query.idToken.trim()) {
    token = req.query.idToken.trim();
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentification Google requise : jeton manquant.',
      authenticated: false,
      code: 'FIREBASE_AUTH_REQUIRED',
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.userUid = decodedToken.uid;

    await getOrCreateUser(decodedToken.uid, decodedToken.email || '');
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token or syncing user:', error);
    return res.status(401).json({
      error: 'Session Google expirée ou invalide. Veuillez vous reconnecter.',
      authenticated: false,
      code: 'FIREBASE_TOKEN_INVALID',
    });
  }
};

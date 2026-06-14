import jwt from 'jsonwebtoken';

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    req.authUser = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

export function requireAuth(req, res, next) {
  verifyToken(req, res, () => {
    if (req.authUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    req.admin = req.authUser;
    next();
  });
}

export function requireCustomer(req, res, next) {
  verifyToken(req, res, () => {
    req.user = req.authUser;
    next();
  });
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.authUser = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    } catch {
      // token invalide ignoré
    }
  }
  next();
}

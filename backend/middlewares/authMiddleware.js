const authService = require('../services/authService');

/**
 * Middleware de autenticação JWT.
 * Verifica token no header Authorization e anexa dados do professor ao req.user.
 * @param {object} req - Objeto da requisição Express.
 * @param {object} res - Objeto da resposta Express.
 * @param {function} next - Função next do Express.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authService.extractTokenFromHeader(authHeader);
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido. Acesso negado.' });
  }
  
  const decoded = authService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
  
  // Anexa dados do professor autenticado ao req
  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    name: decoded.name
  };
  
  next();
}

/**
 * Middleware para verificar se usuário é admin.
 * Deve ser usado APÓS authMiddleware.
 * @param {object} req - Objeto da requisição Express.
 * @param {object} res - Objeto da resposta Express.
 * @param {function} next - Função next do Express.
 */
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
}

module.exports = {
  authMiddleware,
  adminMiddleware
};

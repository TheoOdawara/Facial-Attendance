const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'facial-attendance-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Gera hash bcrypt de uma senha.
 * @param {string} password - Senha em texto plano.
 * @returns {Promise<string>} Hash bcrypt da senha.
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compara senha em texto plano com hash bcrypt.
 * @param {string} password - Senha em texto plano.
 * @param {string} hash - Hash bcrypt armazenado.
 * @returns {Promise<boolean>} True se senha corresponde ao hash.
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Gera token JWT para um professor.
 * @param {object} professor - Objeto professor com id, email, role.
 * @returns {string} Token JWT assinado.
 */
function generateToken(professor) {
  const payload = {
    id: professor.id,
    email: professor.email,
    role: professor.role,
    name: professor.name
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica e decodifica token JWT.
 * @param {string} token - Token JWT.
 * @returns {object|null} Payload decodificado ou null se inválido.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Token inválido:', err.message);
    return null;
  }
}

/**
 * Extrai token do header Authorization.
 * @param {string} authHeader - Header Authorization (formato: "Bearer <token>").
 * @returns {string|null} Token extraído ou null.
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer "
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  extractTokenFromHeader
};

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Rotas
const authRoutes = require('./routes/authRoutes');
const professorRoutes = require('./routes/professorRoutes');
const classRoutes = require('./routes/classRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const captureRoutes = require('./routes/captureRoutes');
const esp32Routes = require('./routes/esp32Routes');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// MIDDLEWARES DE SEGURANÇA
// =============================================================================

// Helmet: Headers HTTP seguros
app.use(helmet());

// CORS: Restringe origens permitidas
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting: 100 requests por minuto por IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// =============================================================================
// ROTA ESP32 (ANTES DO BODY PARSER - multer precisa do stream raw)
// =============================================================================
app.use('/api/esp32', esp32Routes.router);

// Body Parser (NÃO aplicar em /api/esp32)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Log de requisições (desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// =============================================================================
// ROTAS
// =============================================================================

// Rotas públicas
app.use('/api/auth', authRoutes);
// /api/esp32 já foi montado acima (antes do body parser)

// Rotas protegidas (requerem autenticação)
app.use('/api/professors', professorRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/capture-face', captureRoutes);

// Healthcheck
app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  version: '2.0.0',
  timestamp: new Date().toISOString() 
}));

// =============================================================================
// MIDDLEWARES DE ERRO
// =============================================================================

// 404 - Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// Erro genérico
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor.' 
      : err.message 
  });
});

// =============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Backend FacialAttendance v2.0 rodando na porta ${PORT}`);
  console.log(`📋 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS permitido: ${corsOptions.origin}`);
});

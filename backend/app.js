const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const captureRoutes = require('./routes/captureRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Aumentado para imagens VGA de alta qualidade
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Rotas

app.use('/api', studentRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', captureRoutes);

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Middleware de erro genérico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});

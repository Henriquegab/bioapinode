const express = require('express');
const bodyParser = require('body-parser');  // Adicione esta linha
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();

// Use bodyParser para JSON e dados de formulário
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para logging de todas as requisições
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.path}`);
  console.log('Request body:', req.body);
  console.log('Content-Type:', req.get('Content-Type'));  // Adicione esta linha para logar o Content-Type
  next();
});

// Rotas
app.use('/auth', authRoutes);

// Sincronizar modelos com o banco de dados
sequelize.sync().then(() => {
  console.log('Database synced');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
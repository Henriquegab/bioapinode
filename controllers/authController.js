const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Joi = require('joi');

// Schema de validação
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  exports.register = async (req, res) => {
    try {
      // Validar os dados de entrada

      console.log('Received registration request:', req.body);
      const { error } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
  
      const { email, password } = req.body;
  
      // Criar o usuário
      const user = await User.create({ email, password });
  
      // Resposta de sucesso
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { userId: user.id }
      });
    } catch (error) {
      // Verificar se o erro é devido a email duplicado
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
          data: null
        });
      }
  
      // Erro genérico
      res.status(500).json({
        success: false,
        message: 'Error registering user',
        data: error.message
      });
    }
  };

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ 
        success: true,
        message: 'Logado com sucesso!',
        token: token,
        data: {
            id: user.id,
            name: user.name
        }
     });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
};
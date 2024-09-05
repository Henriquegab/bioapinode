const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Joi = require('joi');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuração do Nodemailer usando variáveis do .env
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true', // Verifica se é "true" no .env
});


// Schema de validação
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(3).max(50).required()
  });

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
  });

  exports.register = async (req, res) => {
    try {
      // Validar os dados de entrada

      // console.log('Received registration request:', req.body);
      const { error } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message.replace(/["']/g, '')
        });
      }
  
      const { email, password, name } = req.body;
  
      // Criar o usuário
      const user = await User.create({ email, password, name });
  
      // Resposta de sucesso
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user }
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
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message.replace(/["']/g, '')
      });
    }

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
        data: {
            id: user.id,
            name: user.name,
            token: token,
        }
     });
  } catch (error) {
    res.status(500).json({
    success: false,
    message: 'Erro de servidor'});
  }
};

exports.forgotPassword = async (req, res) => {

  

  try {
    const { error } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message.replace(/["']/g, '')
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'O email informado não corresponde a um email cadastrado!'
         });
    }

    // Gerar um hash/token único para o usuário
    const resetToken = crypto.randomBytes(32).toString('hex');
    // const resetTokenExpiry = Date.now() + 3600000; // Token válido por 1 hora

    // Salvar o hash/token no banco de dados com uma data de expiração
    user.hash = resetToken;
    // user.resetPasswordExpires = resetTokenExpiry;
    await user.save(); // Supondo que você tenha essas colunas no modelo

    // Gera o link de recuperação de senha com o hash/token
    const resetPasswordUrl = `http://localhost:3000/auth/reset-password/${resetToken}`;

    // Enviar email com Nodemailer
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`, // Endereço de envio
      to: user.email, // Destinatário
      subject: 'Recuperação de Senha', // Assunto
      text: `Olá, clique no link a seguir para redefinir sua senha: ${resetPasswordUrl}`, // Texto do email
      html: `<p>Olá,</p><p>Clique no link a seguir para redefinir sua senha:</p><a href="${resetPasswordUrl}">${resetPasswordUrl}</a>`, // HTML do email
    });

    return res.status(200).json({
      success: true,
      message: 'Um email de recuperação foi enviado para o seu endereço!'
    });


  } catch (error) {
    res.status(500).json({
    success: false,
    message: 'Erro de servidor',
    data: error.message});
  }
};
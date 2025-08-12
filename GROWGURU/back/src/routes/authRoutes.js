const express = require('express');
const router = express.Router();
const { login, signup } = require('../controllers/authController');

// @route   POST /api/login
// @desc    Autentica o usuário e retorna um token
// @access  Public
router.post('/login', login);

// @route   POST /api/signup
// @desc    Registra um novo usuário
// @access  Public
router.post('/signup', signup);

module.exports = router;

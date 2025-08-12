const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/userController');
const authenticate = require('../middlewares/authMiddleware');

// @route   GET /api/usuarios
// @desc    Busca o perfil do usuário logado
// @access  Private
router.get('/usuarios', authenticate, getUserProfile);

module.exports = router;

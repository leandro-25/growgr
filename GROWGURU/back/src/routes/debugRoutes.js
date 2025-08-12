const express = require('express');
const router = express.Router();
const { checkTableStructure } = require('../controllers/debugController');

// @route   GET /api/check-table-structure
// @desc    Verifica a estrutura da tabela de transações
// @access  Public
router.get('/check-table-structure', checkTableStructure);

module.exports = router;

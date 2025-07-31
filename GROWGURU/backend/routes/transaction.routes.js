const express = require('express');
const router = express.Router();
const { getTransactions, createTransaction } = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTransactions);
router.post('/', protect, createTransaction);

module.exports = router;

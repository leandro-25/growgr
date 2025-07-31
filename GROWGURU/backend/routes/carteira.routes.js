const express = require('express');
const router = express.Router();
const { getCarteira, buyAsset, sellAsset } = require('../controllers/carteira.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCarteira);
router.post('/', protect, buyAsset);
router.post('/vender', protect, sellAsset);

module.exports = router;

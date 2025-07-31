const express = require('express');
const router = express.Router();
const { getUser } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getUser);

module.exports = router;

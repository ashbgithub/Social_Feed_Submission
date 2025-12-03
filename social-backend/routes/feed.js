const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const feedCtrl = require('../controllers/feedController');

router.get('/', auth, feedCtrl.getFeed);

module.exports = router;

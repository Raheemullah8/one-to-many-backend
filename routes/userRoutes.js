const express = require('express');
const router = express.Router();
const { allUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, allUsers);

module.exports = router;

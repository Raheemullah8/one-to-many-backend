const express = require('express');
const router = express.Router();
const {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
    sendMessage,
    allMessages
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.post('/group', protect, createGroupChat);
router.put('/rename', protect, renameGroup);
router.put('/groupadd', protect, addToGroup);
router.put('/groupremove', protect, removeFromGroup);

// Message routes
router.post('/message', protect, sendMessage);
router.get('/message/:chatId', protect, allMessages);

module.exports = router;

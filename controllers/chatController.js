const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Create or fetch one-to-one chat
exports.accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'UserId param not sent' });
    }

    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } }
      ]
    }).populate("users", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: 'latestMessage.sender',
      select: 'name profilePicture email'
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      const chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user._id, userId]
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id })
        .populate("users", "-password");
      
      res.status(200).json(fullChat);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch all chats for a user
exports.fetchChats = async (req, res) => {
  try {
    let chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'name profilePicture email'
    });

    res.status(200).send(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create group chat
exports.createGroupChat = async (req, res) => {
  try {
    if (!req.body.users || !req.body.name) {
      return res.status(400).json({ message: 'Please fill all the fields' });
    }

    let users = JSON.parse(req.body.users);

    if (users.length < 2) {
      return res.status(400).json({ message: 'More than 2 users are required' });
    }

    users.push(req.user._id);

    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user._id,
      groupImage: req.body.groupImage || ""
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rename group
exports.renameGroup = async (req, res) => {
  try {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    ).populate("users", "-password")
     .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add user to group
exports.addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    ).populate("users", "-password")
     .populate("groupAdmin", "-password");

    if (!added) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(added);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove user from group
exports.removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    ).populate("users", "-password")
     .populate("groupAdmin", "-password");

    if (!removed) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(removed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { content, chatId, messageType, fileUrl } = req.body;

    if (!content && !fileUrl) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    let newMessage = {
      sender: req.user._id,
      content: content || "",
      chat: chatId,
      messageType: messageType || 'text',
      fileUrl: fileUrl || ""
    };

    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name profilePicture");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name profilePicture email'
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch all messages for a chat
exports.allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name profilePicture email")
      .populate("chat")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const User = require('../models/User');

// Search users
exports.allUsers = async (req, res) => {
    try {
        const keyword = req.query.search
            ? {
                $or: [
                    { name: { $regex: req.query.search, $options: "i" } },
                    { email: { $regex: req.query.search, $options: "i" } },
                ],
            }
            : {};

        const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
        res.send(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

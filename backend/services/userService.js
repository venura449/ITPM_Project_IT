const User = require('../models/User');

const safeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
});

const getAll = async ({ role, search } = {}) => {
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (search) {
        const regex = new RegExp(search, 'i');
        filter.$or = [{ name: regex }, { email: regex }];
    }
    const users = await User.find(filter).select('-password').sort('-createdAt');
    return users.map(safeUser);
};

const getById = async (id) => {
    const user = await User.findById(id).select('-password');
    if (!user) throw new Error('User not found');
    return safeUser(user);
};

const updateUser = async (adminId, id, { name, email, role }) => {
    if (String(adminId) === String(id))
        throw new Error('Admin cannot edit their own account here');

    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    if (name !== undefined) {
        if (!name.trim()) throw new Error('Name cannot be empty');
        user.name = name.trim();
    }
    if (email !== undefined) {
        if (!email.trim()) throw new Error('Email cannot be empty');
        const conflict = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: id } });
        if (conflict) throw new Error('Email already in use');
        user.email = email.trim().toLowerCase();
    }
    if (role !== undefined) {
        if (!['participant', 'oc', 'admin'].includes(role))
            throw new Error('Invalid role');
        user.role = role;
    }
    await user.save();
    return safeUser(user);
};

const removeUser = async (adminId, id) => {
    if (String(adminId) === String(id))
        throw new Error('Admin cannot delete their own account');
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');
    await user.deleteOne();
};

module.exports = { getAll, getById, updateUser, removeUser };

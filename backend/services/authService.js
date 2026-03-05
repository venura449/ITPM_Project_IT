const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const safeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
});

const register = async ({ name, email, password }) => {
    if (!name || !email || !password) throw new Error('All fields are required');
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email already in use');
    const user = await User.create({ name, email, password });
    return { user: safeUser(user), token: generateToken(user._id) };
};

const login = async ({ email, password }) => {
    if (!email || !password) throw new Error('Email and password are required');
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
        throw new Error('Invalid email or password');

    // ── Login-streak tracking ────────────────────────────
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (user.lastLoginDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        user.loginStreak = user.lastLoginDate === yesterdayStr
            ? (user.loginStreak || 0) + 1
            : 1;
        user.lastLoginDate = todayStr;
        await user.save();
    }

    return { user: safeUser(user), token: generateToken(user._id) };
};

const updateProfile = async (userId, { name, currentPassword, newPassword }) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (name !== undefined) {
        if (!name.trim()) throw new Error('Name cannot be empty');
        user.name = name.trim();
    }

    if (currentPassword !== undefined || newPassword !== undefined) {
        if (!currentPassword) throw new Error('Current password is required');
        if (!newPassword || newPassword.length < 6)
            throw new Error('New password must be at least 6 characters');
        const match = await user.matchPassword(currentPassword);
        if (!match) throw new Error('Current password is incorrect');
        user.password = newPassword;
    }

    await user.save();
    return { user: safeUser(user) };
};

module.exports = { register, login, updateProfile };

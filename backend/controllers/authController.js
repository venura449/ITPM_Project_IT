const AuthService = require('../services/authService');

const updateProfile = async (req, res) => {
    try {
        const result = await AuthService.updateProfile(req.user._id, req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const register = async (req, res) => {
    try {
        const result = await AuthService.register(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const result = await AuthService.login(req.body);
        res.json(result);
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

module.exports = { register, login, updateProfile };

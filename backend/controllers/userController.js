const userService = require('../services/userService');

const listUsers = async (req, res) => {
    try {
        const users = await userService.getAll(req.query);
        res.json(users);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const getUser = async (req, res) => {
    try {
        const user = await userService.getById(req.params.id);
        res.json(user);
    } catch (err) { res.status(404).json({ message: err.message }); }
};

const updateUser = async (req, res) => {
    try {
        const user = await userService.updateUser(req.user._id, req.params.id, req.body);
        res.json(user);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const deleteUser = async (req, res) => {
    try {
        await userService.removeUser(req.user._id, req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) { res.status(400).json({ message: err.message }); }
};

module.exports = { listUsers, getUser, updateUser, deleteUser };

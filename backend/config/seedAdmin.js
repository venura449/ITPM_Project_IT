const User = require('../models/User');

const seedAdmin = async () => {
    try {
        const exists = await User.findOne({ email: 'admin@sliit.lk' });
        if (!exists) {
            await User.create({
                name: 'Admin',
                email: 'admin@sliit.lk',
                password: 'Gaysha123@',
                role: 'admin',
            });
            console.log('Admin user seeded: admin@sliit.lk / Gaysha123@');
        }
    } catch (err) {
        console.error('Admin seed failed:', err.message);
    }
};

module.exports = seedAdmin;

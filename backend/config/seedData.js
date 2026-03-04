/**
 * Seed dummy data for development.
 * Run standalone:  node backend/config/seedData.js
 * Or auto-runs on server start (dev only) via index.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Merchandise = require('../models/Merchandise');

// ─── Dummy Users ───────────────────────────────────────────────────────────────
const USERS = [
    { name: 'Kavindu Wickramasinghe', email: 'kavindu@sliit.lk', password: 'Test1234@', role: 'oc' },
    { name: 'Dilini Perera', email: 'dilini@sliit.lk', password: 'Test1234@', role: 'oc' },
    { name: 'Saman Kumara', email: 'saman@sliit.lk', password: 'Test1234@', role: 'participant' },
    { name: 'Nethmi Silva', email: 'nethmi@sliit.lk', password: 'Test1234@', role: 'participant' },
    { name: 'Ravindu Fernando', email: 'ravindu@sliit.lk', password: 'Test1234@', role: 'participant' },
    { name: 'Amaya Jayasinghe', email: 'amaya@sliit.lk', password: 'Test1234@', role: 'participant' },
    { name: 'Tharaka Dissanayake', email: 'tharaka@sliit.lk', password: 'Test1234@', role: 'oc' },
];

// ─── Merchandise factory ───────────────────────────────────────────────────────
const MERCH = (adminId) => [
    {
        title: 'Convocation 2025 Hoodie',
        faculty: 'Faculty of Computing',
        event: 'Convocation 2025',
        batchYear: 2025,
        description: 'Premium quality pullover hoodie featuring the SLIIT crest embroidered on the chest. Soft fleece interior, kangaroo pocket, and adjustable drawstring hood.',
        imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80',
        price: 3200,
        status: 'published',
        sizeChart: [{ size: 'S', quantity: 15 }, { size: 'M', quantity: 30 }, { size: 'L', quantity: 25 }, { size: 'XL', quantity: 18 }, { size: 'XXL', quantity: 8 }],
        createdBy: adminId,
        approvedBy: adminId,
    },
    {
        title: 'IT Faculty Batch T-Shirt',
        faculty: 'Faculty of Information Technology',
        event: 'Freshers Day 2025',
        batchYear: 2025,
        description: '100% combed cotton round-neck tee printed with the Faculty of IT logo. Lightweight, breathable and perfect for everyday campus wear.',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
        price: 1400,
        status: 'published',
        sizeChart: [{ size: 'XS', quantity: 10 }, { size: 'S', quantity: 20 }, { size: 'M', quantity: 40 }, { size: 'L', quantity: 35 }, { size: 'XL', quantity: 20 }, { size: 'XXL', quantity: 10 }],
        createdBy: adminId,
        approvedBy: adminId,
    },
    {
        title: 'Engineering Batch Jacket',
        faculty: 'Faculty of Engineering',
        event: 'Engineers Day 2025',
        batchYear: 2025,
        description: 'Slim-fit bomber jacket with ribbed cuffs and collar. Features embroidered Faculty of Engineering patch on the sleeve and batch year on the back.',
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80',
        price: 4500,
        status: 'published',
        sizeChart: [{ size: 'S', quantity: 12 }, { size: 'M', quantity: 22 }, { size: 'L', quantity: 18 }, { size: 'XL', quantity: 10 }, { size: 'XXL', quantity: 5 }],
        createdBy: adminId,
        approvedBy: adminId,
    },
    {
        title: 'Business Faculty Polo Shirt',
        faculty: 'Faculty of Business',
        event: 'Annual Business Forum 2025',
        batchYear: 2025,
        description: 'Elegant pique polo shirt with three-button placket and side vents. Embroidered SLIIT Business School logo on left chest for a smart professional look.',
        imageUrl: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&q=80',
        price: 1800,
        status: 'approved',
        sizeChart: [{ size: 'S', quantity: 8 }, { size: 'M', quantity: 20 }, { size: 'L', quantity: 20 }, { size: 'XL', quantity: 12 }],
        createdBy: adminId,
        approvedBy: adminId,
    },
    {
        title: 'Media Arts Canvas Tote Bag',
        faculty: 'Faculty of Humanities & Sciences',
        event: 'SLIIT Arts Festival 2025',
        batchYear: 2025,
        description: 'Heavy-duty 12oz canvas tote bag featuring exclusive hand-drawn artwork by SLIIT Media Arts students. Spacious interior with inner zip pocket.',
        imageUrl: 'https://images.unsplash.com/photo-1624963119638-a84c78b03a41?w=400&q=80',
        price: 900,
        status: 'approved',
        sizeChart: [{ size: 'M', quantity: 50 }],
        createdBy: adminId,
        approvedBy: adminId,
    },
    {
        title: 'Computing Faculty Cap',
        faculty: 'Faculty of Computing',
        event: 'HackSLIIT 2025',
        batchYear: 2025,
        description: 'Six-panel structured cap in black with green embroidered SLIIT Computing logo. Adjustable strap with brass buckle.',
        imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80',
        price: 750,
        status: 'pending',
        sizeChart: [{ size: 'M', quantity: 60 }, { size: 'L', quantity: 40 }],
        createdBy: adminId,
    },
    {
        title: 'Science Batch Ceramic Mug',
        faculty: 'Faculty of Science',
        event: 'Science Symposium 2025',
        batchYear: 2025,
        description: '350ml ceramic mug with full-wrap sublimation print of the Faculty of Science 2025 batch artwork. MDF gift box included.',
        imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80',
        price: 650,
        status: 'pending',
        sizeChart: [{ size: 'M', quantity: 80 }],
        createdBy: adminId,
    },
    {
        title: 'Architecture Sketchbook Set',
        faculty: 'Faculty of Architecture',
        event: 'Design Week 2025',
        batchYear: 2025,
        description: 'Premium A4 sketchbook (120gsm, 80 pages) bundled with 3 Staedtler pigment liners and a custom SLIIT Architecture branded pencil case.',
        imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
        price: 1950,
        status: 'pending',
        sizeChart: [{ size: 'M', quantity: 35 }],
        createdBy: adminId,
    },
];

// ─── Seed function ─────────────────────────────────────────────────────────────
const seedData = async () => {
    try {
        // Seed users — upsert each by email so it's always idempotent
        const seedEmails = USERS.map((u) => u.email);
        const existingEmails = (await User.find({ email: { $in: seedEmails } }, 'email')).map((u) => u.email);
        const toCreate = USERS.filter((u) => !existingEmails.includes(u.email));

        let createdCount = 0;
        for (const u of toCreate) {
            await User.create(u);
            createdCount++;
        }
        if (createdCount > 0) console.log(`✅  Seeded ${createdCount} new users.`);
        else console.log('⏭  All seed users already exist — skipping user creation.');

        // Seed merchandise — only if none exist at all
        const existingMerch = await Merchandise.countDocuments();
        if (existingMerch === 0) {
            const admin = await User.findOne({ email: 'admin@sliit.lk' });
            if (!admin) {
                console.warn('⚠️  Admin user not found — merchandise seeding skipped. Ensure seedAdmin runs first.');
                return;
            }
            const items = MERCH(admin._id);
            await Merchandise.insertMany(items);
            console.log(`✅  Seeded ${items.length} merchandise items.`);
        } else {
            console.log(`⏭  ${existingMerch} merchandise item(s) already exist — skipping.`);
        }

        console.log('🌱  Seed complete.\n');
        console.log('   Test accounts (password: Test1234@)');
        console.log('   OC Members  : kavindu@sliit.lk | dilini@sliit.lk | tharaka@sliit.lk');
        console.log('   Participants: saman@sliit.lk | nethmi@sliit.lk | ravindu@sliit.lk | amaya@sliit.lk');

    } catch (err) {
        console.error('❌  Seed failed:', err.message);
    }
};

// ─── Run standalone ────────────────────────────────────────────────────────────
if (require.main === module) {
    const connectDB = require('./db');
    const seedAdmin = require('./seedAdmin');

    connectDB()
        .then(() => seedAdmin())
        .then(() => seedData())
        .then(() => mongoose.disconnect())
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = seedData;

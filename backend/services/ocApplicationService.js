const User = require('../models/User');
const Order = require('../models/Order');
const OCApplication = require('../models/OCApplication');

// ─────────────────────────────────────────────────────────────────────────────
//  ENGAGEMENT SCORING ALGORITHM
//
//  Signal            Formula                             Max
//  ─────────────────────────────────────────────────────────────────────────
//  Account age       min(daysSinceJoin / 730 × 50, 50)   50 pts  (caps at 2 yrs)
//  Merchandise       (10 per paid order) + (2 × qty)     unbounded
//  Login streak      min(loginStreak × 3, 90)             90 pts  (caps at 30-day streak)
//  ─────────────────────────────────────────────────────────────────────────
//  "System suggested" threshold: total >= 60
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTION_THRESHOLD = 60;

const computeScore = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 1. Account-age score (days since registration / 730 years × 50, max 50)
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSinceJoin = Math.max(0, (Date.now() - new Date(user.createdAt).getTime()) / msPerDay);
    const accountAgeScore = Math.min(Math.round((daysSinceJoin / 730) * 50), 50);

    // 2. Merchandise score (paid orders)
    const orders = await Order.find({ student: userId, paymentStatus: 'paid' });
    const merchandiseScore = orders.reduce((sum, o) => sum + 10 + 2 * (o.quantity || 1), 0);

    // 3. Login-streak score (3 pts per streak day, max 90)
    const loginStreakScore = Math.min((user.loginStreak || 0) * 3, 90);

    const total = accountAgeScore + merchandiseScore + loginStreakScore;

    return {
        accountAgeScore,
        merchandiseScore,
        loginStreakScore,
        total,
        suggested: total >= SUGGESTION_THRESHOLD,
        loginStreak: user.loginStreak || 0,
        daysSinceJoin: Math.floor(daysSinceJoin),
        orderCount: orders.length,
    };
};

// Submit a new application
const apply = async (studentId, { eventName, motivation }) => {
    if (!eventName || !eventName.trim()) throw new Error('Event name is required');
    if (!motivation || !motivation.trim()) throw new Error('Motivation is required');

    // Check for an existing pending application for the same event
    const existing = await OCApplication.findOne({
        student: studentId,
        eventName: eventName.trim(),
        status: 'pending',
    });
    if (existing) throw new Error('You already have a pending application for this event');

    const breakdown = await computeScore(studentId);

    const app = await OCApplication.create({
        student: studentId,
        eventName: eventName.trim(),
        motivation: motivation.trim(),
        score: breakdown.total,
        scoreBreakdown: {
            accountAgeScore: breakdown.accountAgeScore,
            merchandiseScore: breakdown.merchandiseScore,
            loginStreakScore: breakdown.loginStreakScore,
            total: breakdown.total,
        },
    });

    return OCApplication.findById(app._id).populate('student', 'name email');
};

// Student: my applications
const myApplications = async (studentId) =>
    OCApplication.find({ student: studentId }).sort('-createdAt');

// Admin: all applications sorted by score desc
const allApplications = async () =>
    OCApplication.find()
        .populate('student', 'name email loginStreak createdAt')
        .populate('reviewedBy', 'name')
        .sort({ score: -1, createdAt: 1 });

// Admin: update status
const updateStatus = async (appId, { status, reviewNote }, adminId) => {
    const app = await OCApplication.findById(appId);
    if (!app) throw new Error('Application not found');
    if (!['accepted', 'rejected'].includes(status))
        throw new Error('Status must be accepted or rejected');
    app.status = status;
    app.reviewedBy = adminId;
    app.reviewNote = reviewNote || '';
    await app.save();
    return app.populate('student', 'name email');
};

module.exports = { computeScore, apply, myApplications, allApplications, updateStatus, SUGGESTION_THRESHOLD };

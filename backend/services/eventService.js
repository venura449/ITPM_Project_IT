const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Donation = require('../models/Donation');
const Sponsor = require('../models/Sponsor');
const SponsorInvitation = require('../models/SponsorInvitation');

const REQUIRED_FIELDS = ['title', 'description', 'date', 'location', 'faculty', 'category'];

const getPublished = async ({ faculty, category } = {}) => {
    const filter = { status: 'published' };
    if (faculty) filter.faculty = faculty;
    if (category) filter.category = category;
    const events = await Event.find(filter).populate('createdBy', 'name').sort('-date').lean();
    return Promise.all(events.map(async (ev) => {
        if (!ev.budgetGoal || ev.budgetGoal <= 0) return { ...ev, totalRaised: 0, sponsors: [] };
        const donations = await Donation.find({ event: ev._id }).lean();
        const sponsorTotals = {};
        let total = 0;
        for (const d of donations) {
            total += d.amount;
            const key = String(d.sponsorUser);
            sponsorTotals[key] = (sponsorTotals[key] || 0) + d.amount;
        }
        const sponsorUserIds = Object.keys(sponsorTotals);
        let sponsors = [];
        if (sponsorUserIds.length > 0) {
            const profiles = await Sponsor.find({ user: { $in: sponsorUserIds } }).lean();
            sponsors = profiles
                .map(sp => ({
                    company: sp.company,
                    amount: sponsorTotals[String(sp.user)] || 0,
                    percentage: Math.round((sponsorTotals[String(sp.user)] / ev.budgetGoal) * 100),
                }))
                .filter(s => s.amount > 0)
                .sort((a, b) => b.amount - a.amount);
        }
        return { ...ev, totalRaised: total, sponsors };
    }));
};

const getPending = async () =>
    Event.find({ status: 'pending' }).populate('createdBy', 'name email').sort('-createdAt');

const getApproved = async () =>
    Event.find({ status: 'approved' }).populate('createdBy', 'name email').sort('-createdAt');

const getAll = async () =>
    Event.find().populate('createdBy', 'name email').sort('-createdAt');

const create = async (userId, data) => {
    const { title, description, date, location, faculty, category, imageUrl, budgetGoal, votingEnabled } = data;
    for (const f of REQUIRED_FIELDS) {
        if (!data[f]) throw new Error(`${f} is required`);
    }
    return Event.create({ title, description, date, location, faculty, category, imageUrl, budgetGoal: budgetGoal ?? 0, votingEnabled: !!votingEnabled, createdBy: userId });
};

const approve = async (adminId, id) => {
    const ev = await Event.findById(id);
    if (!ev) throw new Error('Event not found');
    if (ev.status !== 'pending') throw new Error('Only pending events can be approved');
    ev.status = 'approved';
    ev.approvedBy = adminId;
    await ev.save();
    return ev;
};

const publish = async (adminId, id) => {
    const ev = await Event.findById(id);
    if (!ev) throw new Error('Event not found');
    if (ev.status !== 'approved') throw new Error('Event must be approved before publishing');
    ev.status = 'published';
    await ev.save();
    // Auto-invite all sponsors whose categories include this event's category
    if (ev.budgetGoal > 0 && ev.category) {
        const sponsors = await Sponsor.find({ categories: ev.category }).lean();
        for (const sp of sponsors) {
            try {
                await SponsorInvitation.create({ event: ev._id, sponsorUser: sp.user });
            } catch (_) { /* duplicate — skip */ }
        }
    }
    return ev;
};

const unpublish = async (adminId, id) => {
    const ev = await Event.findById(id);
    if (!ev) throw new Error('Event not found');
    if (ev.status !== 'published') throw new Error('Only published events can be unpublished');
    ev.status = 'approved';
    await ev.save();
    return ev;
};

const update = async (userId, role, id, data) => {
    const ev = await Event.findById(id);
    if (!ev) throw new Error('Event not found');
    if (role !== 'admin' && String(ev.createdBy) !== String(userId))
        throw new Error('Not authorized');
    const fields = ['title', 'description', 'date', 'location', 'faculty', 'category', 'imageUrl', 'budgetGoal', 'votingEnabled'];
    for (const f of fields) {
        if (data[f] !== undefined) ev[f] = data[f];
    }
    await ev.save();
    return ev;
};

const remove = async (userId, role, id) => {
    const ev = await Event.findById(id);
    if (!ev) throw new Error('Event not found');
    if (role !== 'admin' && String(ev.createdBy) !== String(userId))
        throw new Error('Not authorized');
    await ev.deleteOne();
};

// ── Registration ─────────────────────────────────────────────────────────────

const register = async (studentId, eventId) => {
    const ev = await Event.findById(eventId);
    if (!ev) throw new Error('Event not found');
    if (ev.status !== 'published') throw new Error('Event is not open for registration');
    const existing = await EventRegistration.findOne({ event: eventId, student: studentId });
    if (existing) {
        if (existing.status === 'registered') throw new Error('Already registered for this event');
        existing.status = 'registered';
        await existing.save();
        return existing;
    }
    return EventRegistration.create({ event: eventId, student: studentId });
};

const unregister = async (studentId, eventId) => {
    const reg = await EventRegistration.findOne({ event: eventId, student: studentId, status: 'registered' });
    if (!reg) throw new Error('Registration not found');
    reg.status = 'cancelled';
    await reg.save();
    return reg;
};

const getRegistrationsByEvent = async (eventId) =>
    EventRegistration.find({ event: eventId, status: 'registered' })
        .populate('student', 'name email role')
        .sort('-createdAt');

const getMyRegistrations = async (studentId) =>
    EventRegistration.find({ student: studentId, status: 'registered' })
        .populate('event', 'title date location faculty category status imageUrl')
        .sort('-createdAt');

const getRegistrationStatus = async (studentId, eventId) => {
    const reg = await EventRegistration.findOne({ event: eventId, student: studentId });
    return reg ? reg.status : null;
};

module.exports = {
    getPublished, getPending, getApproved, getAll,
    create, approve, publish, unpublish, update, remove,
    register, unregister, getRegistrationsByEvent, getMyRegistrations, getRegistrationStatus,
};

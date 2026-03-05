const User = require('../models/User');
const Sponsor = require('../models/Sponsor');
const SponsorInvitation = require('../models/SponsorInvitation');
const Donation = require('../models/Donation');
const Event = require('../models/Event');

// ── Admin: CRUD Sponsors ─────────────────────────────────────────────────────

const createSponsor = async ({ name, email, password, company, website, description, categories, donationBudget }) => {
    if (!name || !email || !password || !company) throw new Error('Name, email, password and company are required');
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new Error('A user with this email already exists');
    const user = await User.create({ name, email, password, role: 'sponsor' });
    const cats = categories || [];
    const sponsor = await Sponsor.create({
        user: user._id, company, website: website || '', description: description || '',
        categories: cats, donationBudget: donationBudget || 0,
    });
    // Auto-invite sponsor to all published events with a matching category and budget
    if (cats.length > 0) {
        const matchingEvents = await Event.find({
            status: 'published',
            budgetGoal: { $gt: 0 },
            category: { $in: cats },
        }).lean();
        for (const ev of matchingEvents) {
            try {
                await SponsorInvitation.create({ event: ev._id, sponsorUser: user._id });
            } catch (_) { /* duplicate — skip */ }
        }
    }
    return { user, sponsor };
};

const getAll = async () =>
    Sponsor.find().populate('user', 'name email createdAt').sort('-createdAt');

const getById = async (id) => {
    const s = await Sponsor.findById(id).populate('user', 'name email');
    if (!s) throw new Error('Sponsor not found');
    return s;
};

const getBySponsorUserId = async (userId) => {
    const s = await Sponsor.findOne({ user: userId }).populate('user', 'name email');
    if (!s) throw new Error('Sponsor profile not found');
    return s;
};

const update = async (id, { company, website, description, categories, donationBudget }) => {
    const s = await Sponsor.findById(id);
    if (!s) throw new Error('Sponsor not found');
    if (company !== undefined) s.company = company.trim();
    if (website !== undefined) s.website = website.trim();
    if (description !== undefined) s.description = description.trim();
    if (categories !== undefined) s.categories = categories;
    if (donationBudget !== undefined) s.donationBudget = Number(donationBudget);
    await s.save();
    return Sponsor.findById(id).populate('user', 'name email');
};

const remove = async (id) => {
    const s = await Sponsor.findById(id);
    if (!s) throw new Error('Sponsor not found');
    const userId = s.user;
    await SponsorInvitation.deleteMany({ sponsorUser: userId });
    await Donation.deleteMany({ sponsorUser: userId });
    await s.deleteOne();
    await User.findByIdAndDelete(userId);
};

// ── Matching & Invitations ───────────────────────────────────────────────────

const matchEventToSponsors = async (eventId) => {
    const ev = await Event.findById(eventId);
    if (!ev) throw new Error('Event not found');
    if (!ev.budgetGoal || ev.budgetGoal <= 0) throw new Error('This event has no sponsor budget set');
    const sponsors = await Sponsor.find({ categories: ev.category });
    let invited = 0;
    for (const sp of sponsors) {
        try {
            await SponsorInvitation.create({ event: eventId, sponsorUser: sp.user });
            invited++;
        } catch (_) { /* duplicate — already invited */ }
    }
    return { invited, total: sponsors.length };
};

const autoMatchAll = async () => {
    const events = await Event.find({ status: { $in: ['approved', 'published'] }, budgetGoal: { $gt: 0 } });
    let total = 0;
    for (const ev of events) {
        const { invited } = await matchEventToSponsors(ev._id);
        total += invited;
    }
    return { total };
};

const getAllInvitations = async () =>
    SponsorInvitation.find()
        .populate('event', 'title category faculty date status budgetGoal')
        .populate('sponsorUser', 'name email')
        .sort('-createdAt');

const getInvitationsForSponsor = async (userId) => {
    const invitations = await SponsorInvitation.find({ sponsorUser: userId })
        .populate('event', 'title category faculty date location description budgetGoal imageUrl status')
        .sort('-createdAt');

    return Promise.all(invitations.map(async (inv) => {
        const obj = inv.toObject();
        if (inv.status === 'accepted' && inv.event) {
            const agg = await Donation.aggregate([
                { $match: { event: inv.event._id } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            obj.totalRaised = agg[0]?.total || 0;
            obj.myDonations = await Donation.find({ event: inv.event._id, sponsorUser: userId }).sort('-createdAt').lean();
        }
        return obj;
    }));
};

const respondToInvitation = async (userId, invitationId, status) => {
    const inv = await SponsorInvitation.findById(invitationId);
    if (!inv) throw new Error('Invitation not found');
    if (String(inv.sponsorUser) !== String(userId)) throw new Error('Not authorized');
    if (inv.status !== 'pending') throw new Error('Invitation already responded to');
    inv.status = status;
    inv.respondedAt = new Date();
    await inv.save();
    return inv;
};

// ── Donations ────────────────────────────────────────────────────────────────

const donate = async (userId, eventId, amount, note) => {
    if (!amount || Number(amount) <= 0) throw new Error('Amount must be greater than 0');
    const inv = await SponsorInvitation.findOne({ sponsorUser: userId, event: eventId, status: 'accepted' });
    if (!inv) throw new Error('You must accept the invitation before donating');
    const ev = await Event.findById(eventId);
    if (!ev) throw new Error('Event not found');
    if (ev.budgetGoal > 0) {
        const agg = await Donation.aggregate([
            { $match: { event: ev._id } },
            { $group: { _id: null, sum: { $sum: '$amount' } } },
        ]);
        const raised = agg[0]?.sum || 0;
        const remaining = ev.budgetGoal - raised;
        if (remaining <= 0) throw new Error('Donation goal already reached');
        if (Number(amount) > remaining) throw new Error(`Maximum donatable amount is Rs. ${remaining.toLocaleString()}`);
    }
    return Donation.create({ event: eventId, sponsorUser: userId, amount: Number(amount), note: note || '' });
};

const getDonationsForEvent = async (eventId) =>
    Donation.find({ event: eventId })
        .populate('sponsorUser', 'name email')
        .sort('-createdAt');

const getMyDonations = async (userId) =>
    Donation.find({ sponsorUser: userId })
        .populate('event', 'title date faculty category budgetGoal')
        .sort('-createdAt');

const getAllDonations = async () =>
    Donation.find()
        .populate('sponsorUser', 'name email')
        .populate('event', 'title date faculty category budgetGoal')
        .sort('-createdAt');

// Allow a sponsor to self-initiate (creates or auto-accepts an invitation)
const selfInvite = async (userId, eventId) => {
    const ev = await Event.findById(eventId);
    if (!ev) throw new Error('Event not found');
    if (!ev.budgetGoal || ev.budgetGoal <= 0) throw new Error('This event has no sponsor budget');
    let inv = await SponsorInvitation.findOne({ sponsorUser: userId, event: eventId });
    if (!inv) {
        inv = await SponsorInvitation.create({
            event: eventId,
            sponsorUser: userId,
            status: 'accepted',
            respondedAt: new Date(),
        });
    } else if (inv.status !== 'accepted') {
        inv.status = 'accepted';
        inv.respondedAt = new Date();
        await inv.save();
    }
    return inv;
};

// Returns map of { eventId: totalRaised } for all events
const getEventTotals = async () => {
    const agg = await Donation.aggregate([
        { $group: { _id: '$event', total: { $sum: '$amount' } } },
    ]);
    const result = {};
    agg.forEach(({ _id, total }) => { result[String(_id)] = total; });
    return result;
};

module.exports = {
    createSponsor, getAll, getById, getBySponsorUserId, update, remove,
    matchEventToSponsors, autoMatchAll,
    getAllInvitations, getInvitationsForSponsor, respondToInvitation,
    donate, getDonationsForEvent, getMyDonations, getAllDonations,
    selfInvite, getEventTotals,
};

const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');

const REQUIRED_FIELDS = ['title', 'description', 'date', 'location', 'faculty', 'category'];

const getPublished = async ({ faculty, category } = {}) => {
    const filter = { status: 'published' };
    if (faculty) filter.faculty = faculty;
    if (category) filter.category = category;
    return Event.find(filter).populate('createdBy', 'name').sort('-date');
};

const getPending = async () =>
    Event.find({ status: 'pending' }).populate('createdBy', 'name email').sort('-createdAt');

const getApproved = async () =>
    Event.find({ status: 'approved' }).populate('createdBy', 'name email').sort('-createdAt');

const getAll = async () =>
    Event.find().populate('createdBy', 'name email').sort('-createdAt');

const create = async (userId, data) => {
    const { title, description, date, location, faculty, category, imageUrl } = data;
    for (const f of REQUIRED_FIELDS) {
        if (!data[f]) throw new Error(`${f} is required`);
    }
    return Event.create({ title, description, date, location, faculty, category, imageUrl, createdBy: userId });
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
    const fields = ['title', 'description', 'date', 'location', 'faculty', 'category', 'imageUrl'];
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

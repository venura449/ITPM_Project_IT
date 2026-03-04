const Merchandise = require('../models/Merchandise');

const getPublished = async ({ faculty, event } = {}) => {
    const filter = { status: 'published' };
    if (faculty) filter.faculty = new RegExp(faculty, 'i');
    if (event) filter.event = new RegExp(event, 'i');
    return Merchandise.find(filter)
        .populate('createdBy', 'name')
        .sort('-createdAt');
};

const getPending = async () =>
    Merchandise.find({ status: 'pending' })
        .populate('createdBy', 'name email')
        .sort('-createdAt');

const getApproved = async () =>
    Merchandise.find({ status: 'approved' })
        .populate('createdBy', 'name email')
        .sort('-createdAt');

const create = async (userId, data) => {
    const { title, faculty, event, batchYear, description, imageUrl, sizeChart, price } = data;
    if (!title || !faculty || !event || !batchYear || !description || !price)
        throw new Error('All fields are required');
    if (!Array.isArray(sizeChart) || sizeChart.length === 0)
        throw new Error('At least one size entry is required');
    return Merchandise.create({ title, faculty, event, batchYear, description, imageUrl, sizeChart, price, createdBy: userId });
};

const approve = async (adminId, id) => {
    const item = await Merchandise.findById(id);
    if (!item) throw new Error('Merchandise not found');
    if (item.status !== 'pending') throw new Error('Only pending items can be approved');
    item.status = 'approved';
    item.approvedBy = adminId;
    await item.save();
    return item;
};

const publish = async (userId, id) => {
    const item = await Merchandise.findById(id);
    if (!item) throw new Error('Merchandise not found');
    if (item.status !== 'approved') throw new Error('Item must be approved before publishing');
    item.status = 'published';
    await item.save();
    return item;
};

const unpublish = async (userId, id) => {
    const item = await Merchandise.findById(id);
    if (!item) throw new Error('Merchandise not found');
    if (item.status !== 'published') throw new Error('Only published items can be unpublished');
    item.status = 'approved';
    await item.save();
    return item;
};

const remove = async (userId, role, id) => {
    const item = await Merchandise.findById(id);
    if (!item) throw new Error('Merchandise not found');
    if (role !== 'admin' && String(item.createdBy) !== String(userId))
        throw new Error('Not authorized');
    await item.deleteOne();
};

const update = async (userId, role, id, data) => {
    const item = await Merchandise.findById(id);
    if (!item) throw new Error('Merchandise not found');
    if (role !== 'admin' && String(item.createdBy) !== String(userId))
        throw new Error('Not authorized');
    const { title, faculty, event, batchYear, description, imageUrl, sizeChart, price } = data;
    if (title !== undefined) item.title = title.trim();
    if (faculty !== undefined) item.faculty = faculty.trim();
    if (event !== undefined) item.event = event.trim();
    if (batchYear !== undefined) item.batchYear = Number(batchYear);
    if (description !== undefined) item.description = description.trim();
    if (imageUrl !== undefined) item.imageUrl = imageUrl.trim();
    if (price !== undefined) item.price = Number(price);
    if (Array.isArray(sizeChart) && sizeChart.length > 0) item.sizeChart = sizeChart;
    await item.save();
    return item;
};

module.exports = { getPublished, getPending, getApproved, create, update, approve, publish, unpublish, remove };

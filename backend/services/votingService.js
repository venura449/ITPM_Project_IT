const VotingContest = require('../models/VotingContest');
const Vote          = require('../models/Vote');

// Admin: get contest details with vote counts
const getResults = async (eventId) => {
    const contest = await VotingContest.findOne({ event: eventId }).lean();
    if (!contest) return null;
    const votes = await Vote.find({ event: eventId }).lean();
    const counts = {};
    votes.forEach(v => { counts[v.contestantNumber] = (counts[v.contestantNumber] || 0) + 1; });
    return {
        ...contest,
        totalVotes: votes.length,
        contestants: contest.contestants.map(c => ({ ...c, votes: counts[c.number] || 0 })),
    };
};

// Admin: create / update contestants (only allowed while draft)
const saveContestants = async (eventId, contestants) => {
    if (!Array.isArray(contestants) || contestants.length === 0)
        throw new Error('At least one contestant is required');
    const nums = contestants.map(c => Number(c.number));
    if (nums.some(n => isNaN(n) || n < 1)) throw new Error('All contestants must have a valid positive number');
    if (new Set(nums).size !== nums.length) throw new Error('Contestant numbers must be unique');
    const cleaned = contestants.map(c => ({ number: Number(c.number), name: String(c.name).trim() }));

    const existing = await VotingContest.findOne({ event: eventId });
    if (existing) {
        if (existing.status !== 'draft')
            throw new Error('Cannot edit contestants once voting is open or closed');
        existing.contestants = cleaned;
        await existing.save();
        return existing;
    }
    return VotingContest.create({ event: eventId, contestants: cleaned });
};

// Admin: open voting
const openVoting = async (eventId) => {
    const contest = await VotingContest.findOne({ event: eventId });
    if (!contest) throw new Error('No voting session found. Save contestants first.');
    if (contest.contestants.length < 2) throw new Error('At least 2 contestants are required to open voting');
    if (contest.status === 'closed') throw new Error('Closed voting cannot be reopened');
    if (contest.status === 'open') throw new Error('Voting is already open');
    contest.status = 'open';
    await contest.save();
    return contest;
};

// Admin: close voting
const closeVoting = async (eventId) => {
    const contest = await VotingContest.findOne({ event: eventId });
    if (!contest || contest.status !== 'open') throw new Error('Voting is not currently open');
    contest.status = 'closed';
    await contest.save();
    return contest;
};

// Auth user: get all active/closed contests with myVote info
const getAllContexts = async (userId) => {
    const contests = await VotingContest.find({ status: { $in: ['open', 'closed'] } }).lean();
    if (contests.length === 0) return [];
    const eventIds = contests.map(c => c.event);
    const userVotes = userId
        ? await Vote.find({ event: { $in: eventIds }, voter: userId }).lean()
        : [];
    const voteMap = {};
    userVotes.forEach(v => { voteMap[String(v.event)] = v.contestantNumber; });
    return contests.map(c => ({
        eventId:     String(c.event),
        status:      c.status,
        contestants: c.contestants,
        myVote:      voteMap[String(c.event)] ?? null,
    }));
};

// Auth user: cast a vote (one per event)
const castVote = async (userId, eventId, contestantNumber) => {
    const contest = await VotingContest.findOne({ event: eventId });
    if (!contest) throw new Error('No voting session for this event');
    if (contest.status !== 'open') throw new Error('Voting is not currently open');
    const num = Number(contestantNumber);
    if (!contest.contestants.find(c => c.number === num)) throw new Error('Contestant not found');
    const existing = await Vote.findOne({ event: eventId, voter: userId });
    if (existing) throw new Error('You have already voted for this event');
    return Vote.create({ event: eventId, voter: userId, contestantNumber: num });
};

module.exports = { getResults, saveContestants, openVoting, closeVoting, getAllContexts, castVote };

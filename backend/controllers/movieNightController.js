const MovieNightSession = require("../models/MovieNightSession");

const generateCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const createSession = async (req, res, next) => {
  try {
    const { candidateMovieIds = [] } = req.body;
    const code = generateCode();

    const session = await MovieNightSession.create({
      code,
      hostId: req.user._id,
      members: [req.user._id],
      candidateMovieIds,
      swipes: []
    });

    return res.status(201).json(session);
  } catch (error) {
    return next(error);
  }
};

const joinSession = async (req, res, next) => {
  try {
    const { code } = req.body;
    const session = await MovieNightSession.findOne({ code, status: "open" });
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (!session.members.some((id) => String(id) === String(req.user._id))) {
      session.members.push(req.user._id);
      await session.save();
    }

    return res.json(session);
  } catch (error) {
    return next(error);
  }
};

const submitSwipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { movieId, choice } = req.body;
    const session = await MovieNightSession.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const member = session.members.some((m) => String(m) === String(req.user._id));
    if (!member) return res.status(403).json({ message: "Join session first" });

    const existing = session.swipes.find(
      (s) => s.movieId === movieId && String(s.userId) === String(req.user._id)
    );
    if (existing) {
      existing.choice = choice;
    } else {
      session.swipes.push({ userId: req.user._id, movieId, choice });
    }

    await session.save();
    return res.json({ message: "Swipe saved" });
  } catch (error) {
    return next(error);
  }
};

const getMatch = async (req, res, next) => {
  try {
    const session = await MovieNightSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const memberIds = session.members.map((m) => String(m));
    const yesByMovie = new Map();

    session.swipes.forEach((swipe) => {
      if (swipe.choice !== "yes") return;
      if (!yesByMovie.has(swipe.movieId)) {
        yesByMovie.set(swipe.movieId, new Set());
      }
      yesByMovie.get(swipe.movieId).add(String(swipe.userId));
    });

    const matches = [];
    yesByMovie.forEach((set, movieId) => {
      const allYes = memberIds.every((id) => set.has(id));
      if (allYes) matches.push(movieId);
    });

    return res.json({ matches });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createSession,
  joinSession,
  submitSwipe,
  getMatch
};

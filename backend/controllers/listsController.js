const List = require("../models/List");

const canEditList = (list, userId) => {
  if (String(list.userId) === String(userId)) return true;
  return list.collaborators.some(
    (c) => String(c.userId) === String(userId) && ["owner", "editor"].includes(c.role)
  );
};

const getMyLists = async (req, res, next) => {
  try {
    const lists = await List.find({
      $or: [{ userId: req.user._id }, { "collaborators.userId": req.user._id }]
    }).sort({ updatedAt: -1 });
    return res.json(lists);
  } catch (error) {
    return next(error);
  }
};

const createList = async (req, res, next) => {
  try {
    const { name, description = "", isCollaborative = false } = req.body;
    if (!name) {
      return res.status(400).json({ message: "name required" });
    }

    const list = await List.create({
      name,
      description,
      userId: req.user._id,
      isCollaborative,
      collaborators: [{ userId: req.user._id, role: "owner" }],
      movies: [],
      votes: []
    });

    return res.status(201).json(list);
  } catch (error) {
    return next(error);
  }
};

const addCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role = "editor" } = req.body;
    const list = await List.findById(id);
    if (!list) return res.status(404).json({ message: "List not found" });
    if (String(list.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const exists = list.collaborators.some((c) => String(c.userId) === String(userId));
    if (!exists) {
      list.collaborators.push({ userId, role });
      list.isCollaborative = true;
      await list.save();
    }

    return res.json(list);
  } catch (error) {
    return next(error);
  }
};

const addMovieToList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { movieId } = req.body;
    const list = await List.findById(id);
    if (!list) return res.status(404).json({ message: "List not found" });
    if (!canEditList(list, req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (!list.movies.includes(movieId)) {
      list.movies.push(movieId);
      await list.save();
    }

    return res.json(list);
  } catch (error) {
    return next(error);
  }
};

const voteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { movieId, value } = req.body;
    if (![1, -1].includes(value)) {
      return res.status(400).json({ message: "value must be 1 or -1" });
    }

    const list = await List.findById(id);
    if (!list) return res.status(404).json({ message: "List not found" });
    if (!canEditList(list, req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const existing = list.votes.find(
      (v) => v.movieId === movieId && String(v.userId) === String(req.user._id)
    );

    if (existing) {
      existing.value = value;
    } else {
      list.votes.push({ movieId, userId: req.user._id, value });
    }

    await list.save();

    const score = list.votes
      .filter((v) => v.movieId === movieId)
      .reduce((acc, cur) => acc + cur.value, 0);

    return res.json({ movieId, score });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyLists,
  createList,
  addCollaborator,
  addMovieToList,
  voteMovie
};

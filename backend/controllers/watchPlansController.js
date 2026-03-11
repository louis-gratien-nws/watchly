const WatchPlan = require("../models/WatchPlan");

const getPlans = async (req, res, next) => {
  try {
    const plans = await WatchPlan.find({ userId: req.user._id }).sort({ plannedFor: 1 });
    return res.json(plans);
  } catch (error) {
    return next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const {
      movieId,
      movieTitle = "",
      posterPath = "",
      plannedFor,
      remindByEmail = true,
      remindByPush = false
    } = req.body;
    if (!movieId || !plannedFor) {
      return res.status(400).json({ message: "movieId and plannedFor required" });
    }

    const date = new Date(plannedFor);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingPlan = await WatchPlan.findOne({
      userId: req.user._id,
      movieId: Number(movieId),
      plannedFor: { $gte: dayStart, $lte: dayEnd }
    });

    if (existingPlan) {
      return res.status(409).json({ message: "Movie already planned for this day" });
    }

    const plan = await WatchPlan.create({
      userId: req.user._id,
      movieId,
      movieTitle,
      posterPath,
      plannedFor,
      remindByEmail,
      remindByPush
    });

    return res.status(201).json(plan);
  } catch (error) {
    return next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await WatchPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    if (String(plan.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const allowed = ["plannedFor", "status", "remindByEmail", "remindByPush"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        plan[key] = req.body[key];
      }
    }

    await plan.save();
    return res.json(plan);
  } catch (error) {
    return next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const plan = await WatchPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    if (String(plan.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await WatchPlan.findByIdAndDelete(req.params.id);
    return res.json({ message: "Plan deleted" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
};

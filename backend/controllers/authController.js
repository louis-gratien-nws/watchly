const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const serializeUser = (user) => ({
  _id: user._id,
  id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  followers: user.followers || [],
  following: user.following || [],
  friends: user.friends || [],
  friendRequestsSent: user.friendRequestsSent || [],
  friendRequestsReceived: user.friendRequestsReceived || [],
  watched: user.watched || [],
  reviews: user.reviews || [],
  achievements: user.achievements || [],
  stats: user.stats || {},
  level: user.level || 1,
  xp: user.xp || 0,
  watchStreak: user.watchStreak || 0,
  unreadNotifications: user.unreadNotifications || 0
});

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const register = async (req, res, next) => {
  try {
    const username = (req.body?.username || "").trim();
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password required" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      watchlist: [],
      favorites: [],
      watched: [],
      reviews: [],
      followers: [],
      following: [],
      friends: [],
      friendRequestsSent: [],
      friendRequestsReceived: [],
      achievements: []
    });

    const token = signToken(user._id);
    return res.status(201).json({
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const identifier = (req.body?.email || req.body?.identifier || "").trim();
    const password = req.body?.password;

    if (!identifier || !password) {
      return res.status(400).json({ message: "email/username and password required" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: { $regex: `^${escapeRegex(identifier)}$`, $options: "i" } }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id);
    return res.json({
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

module.exports = {
  register,
  login,
  me
};

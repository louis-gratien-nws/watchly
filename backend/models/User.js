const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200"
    },
    bio: { type: String, default: "Movie lover" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    watchlist: [{ type: Number }],
    favorites: [{ type: Number }],
    watched: [{ type: Number }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    achievements: [{ type: String }],
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    watchStreak: { type: Number, default: 0 },
    lastWatchedAt: { type: Date, default: null },
    preferredGenres: [{ type: Number }],
    language: { type: String, default: "fr" },
    notificationsEnabled: { type: Boolean, default: true },
    // Stats détaillées
    stats: {
      moviesWatched: { type: Number, default: 0 },
      totalWatchTime: { type: Number, default: 0 }, // en minutes
      reviewsCount: { type: Number, default: 0 },
      likesCount: { type: Number, default: 0 },
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      friendsCount: { type: Number, default: 0 },
      genreStats: [
        {
          genreId: { type: Number },
          genreName: { type: String },
          count: { type: Number, default: 0 },
          avgRating: { type: Number, default: 0 }
        }
      ],
      providerStats: [
        {
          providerId: { type: Number },
          providerName: { type: String },
          count: { type: Number, default: 0 }
        }
      ]
    },
    unreadNotifications: { type: Number, default: 0 }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("User", userSchema);

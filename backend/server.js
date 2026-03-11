const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const parseCorsOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "";

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = parseCorsOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    }
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "watchly-backend" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/movies", require("./routes/movieRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/recommendations", require("./routes/recommendationRoutes"));
app.use("/api/lists", require("./routes/listRoutes"));
app.use("/api/plans", require("./routes/watchPlanRoutes"));
app.use("/api/movie-night", require("./routes/movieNightRoutes"));
app.use("/api/social", require("./routes/socialRoutes"));
app.use("/api/likes", require("./routes/likesRoutes"));
app.use("/api/chats", require("./routes/chatRoutes"));

app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Watchly backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();

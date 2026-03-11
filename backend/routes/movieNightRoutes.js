const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createSession,
  joinSession,
  submitSwipe,
  getMatch
} = require("../controllers/movieNightController");

const router = express.Router();

router.post("/", authMiddleware, createSession);
router.post("/join", authMiddleware, joinSession);
router.post("/:id/swipe", authMiddleware, submitSwipe);
router.get("/:id/match", authMiddleware, getMatch);

module.exports = router;

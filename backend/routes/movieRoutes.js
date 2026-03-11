const express = require("express");
const {
  trending,
  popular,
  topRated,
  upcoming,
  getById,
  search,
  discover
} = require("../controllers/moviesController");

const router = express.Router();

router.get("/trending", trending);
router.get("/popular", popular);
router.get("/top-rated", topRated);
router.get("/upcoming", upcoming);
router.get("/search", search);
router.get("/discover", discover);
router.get("/:id", getById);

module.exports = router;

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMyLists,
  createList,
  addCollaborator,
  addMovieToList,
  voteMovie
} = require("../controllers/listsController");

const router = express.Router();

router.get("/", authMiddleware, getMyLists);
router.post("/", authMiddleware, createList);
router.post("/:id/collaborators", authMiddleware, addCollaborator);
router.post("/:id/movies", authMiddleware, addMovieToList);
router.post("/:id/vote", authMiddleware, voteMovie);

module.exports = router;

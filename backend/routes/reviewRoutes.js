const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createReview,
  getMovieReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  likeReview,
  commentReview
} = require("../controllers/reviewsController");

const router = express.Router();

router.post("/", authMiddleware, createReview);
router.get("/me", authMiddleware, getMyReviews);
router.get("/movie/:id", getMovieReviews);
router.put("/:id", authMiddleware, updateReview);
router.delete("/:id", authMiddleware, deleteReview);
router.post("/:id/like", authMiddleware, likeReview);
router.post("/:id/comment", authMiddleware, commentReview);

module.exports = router;

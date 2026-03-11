const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const likesController = require("../controllers/likesController");

router.post("/review", authMiddleware, likesController.likeReview);
router.post("/review/unlike", authMiddleware, likesController.unlikeReview);

router.post("/list", authMiddleware, likesController.likeList);
router.post("/list/unlike", authMiddleware, likesController.unlikeList);

router.get("/count", likesController.getLikesCount);
router.get("/check", authMiddleware, likesController.isLiked);

module.exports = router;

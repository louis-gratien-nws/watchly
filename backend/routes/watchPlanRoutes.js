const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
} = require("../controllers/watchPlansController");

const router = express.Router();

router.get("/", authMiddleware, getPlans);
router.post("/", authMiddleware, createPlan);
router.put("/:id", authMiddleware, updatePlan);
router.delete("/:id", authMiddleware, deletePlan);

module.exports = router;

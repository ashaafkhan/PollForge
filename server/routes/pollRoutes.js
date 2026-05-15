import { Router } from "express";
import { body } from "express-validator";
import {
  activatePoll,
  createPoll,
  deletePoll,
  getAnalytics,
  getPollById,
  getMyPolls,
  getPollBySlug,
  updatePoll
} from "../controllers/pollController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  [body("title").trim().isLength({ min: 3 })],
  createPoll
);

router.get("/my", authMiddleware, getMyPolls);
router.get("/id/:id", authMiddleware, getPollById);
router.get("/:id/analytics", authMiddleware, getAnalytics);
router.get("/:slug", getPollBySlug);
router.put("/:id", authMiddleware, updatePoll);
router.delete("/:id", authMiddleware, deletePoll);
router.patch("/:id/activate", authMiddleware, activatePoll);

export default router;

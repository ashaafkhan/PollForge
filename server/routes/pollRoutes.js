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
  updatePoll,
  publishPoll
} from "../controllers/pollController.js";
import { getPollQR } from "../controllers/qrController.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  [body("title").trim().isLength({ min: 3 })],
  createPoll
);

router.get("/my", authMiddleware, getMyPolls);
router.get("/id/:id", authMiddleware, getPollById);
router.get("/:id/analytics", optionalAuthMiddleware, getAnalytics);
router.get("/:slug", getPollBySlug);
router.put("/:id", authMiddleware, updatePoll);
router.delete("/:id", authMiddleware, deletePoll);
router.patch("/:id/activate", authMiddleware, activatePoll);
router.patch("/:id/publish", authMiddleware, publishPoll);
router.get("/:id/qr", getPollQR);

export default router;

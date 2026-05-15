import { Router } from "express";
import rateLimit from "express-rate-limit";
import { submitResponse, checkResponse } from "../controllers/responseController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

const responseRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many submissions, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

router.post("/", responseRateLimit, optionalAuth, submitResponse);
router.get("/check/:pollId", optionalAuth, checkResponse);

export default router;

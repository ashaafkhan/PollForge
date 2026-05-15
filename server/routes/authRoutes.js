import { Router } from "express";
import { body } from "express-validator";
import {
  login,
  logout,
  me,
  refresh,
  register,
  googleCallback
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import passport from "passport";

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 })
  ],
  register
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  login
);

router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login?error=google_auth_failed", session: false }), googleCallback);

export default router;

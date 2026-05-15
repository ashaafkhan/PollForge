import { Router } from "express";
import { submitResponse, checkResponse } from "../controllers/responseController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

router.post("/", optionalAuth, submitResponse);
router.get("/check/:pollId", optionalAuth, checkResponse);

export default router;

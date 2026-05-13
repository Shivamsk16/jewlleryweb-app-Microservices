import { Router } from "express";
import * as dashboard from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);
router.get("/summary", dashboard.summary);
router.get("/trends", dashboard.trends);
router.get("/recent", dashboard.recent);

export default router;

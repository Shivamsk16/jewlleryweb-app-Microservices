import { Router } from "express";
import * as notifications from "../controllers/notifications.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);
router.get("/", notifications.list);
router.get("/unread-count", notifications.unreadCount);
router.put("/:id/read", notifications.markRead);

export default router;

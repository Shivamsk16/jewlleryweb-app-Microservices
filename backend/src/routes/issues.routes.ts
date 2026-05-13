import { Router } from "express";
import * as issues from "../controllers/issues.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);
router.get("/overdue", issues.overdue);
router.get("/", issues.list);
router.post("/", issues.create);
router.get("/:id", issues.detail);
router.put("/:id", issues.update);

export default router;

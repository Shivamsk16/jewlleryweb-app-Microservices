import { Router } from "express";
import * as receives from "../controllers/receives.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);
router.get("/", receives.list);
router.post("/", receives.create);
router.get("/:id", receives.detail);

export default router;

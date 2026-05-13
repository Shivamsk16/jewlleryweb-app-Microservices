import { Router } from "express";
import * as vendors from "../controllers/vendors.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);
router.get("/", vendors.list);
router.post("/", vendors.create);
router.get("/:id", vendors.detail);
router.put("/:id", vendors.update);
router.get("/:id/balance", vendors.balance);

export default router;

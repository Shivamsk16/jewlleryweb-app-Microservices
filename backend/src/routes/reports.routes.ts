import { Router } from "express";
import * as reports from "../controllers/reports.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);
router.get("/stock", reports.stock);
router.get("/vendor-pending", reports.vendorPending);
router.get("/production", reports.production);
router.get("/wastage", reports.wastage);

export default router;

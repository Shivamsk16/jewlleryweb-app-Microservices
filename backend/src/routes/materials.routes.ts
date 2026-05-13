import { Router } from "express";
import * as materials from "../controllers/materials.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/stock", requireAuth, materials.stock);
router.get("/", requireAuth, materials.list);
router.post("/", requireAuth, materials.create);
router.put("/:id", requireAdmin, materials.update);
router.delete("/:id", requireAdmin, materials.softDelete);

export default router;

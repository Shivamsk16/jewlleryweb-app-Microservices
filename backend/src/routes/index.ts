import { Router } from "express";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import materialsRoutes from "./materials.routes";
import vendorsRoutes from "./vendors.routes";
import issuesRoutes from "./issues.routes";
import receivesRoutes from "./receives.routes";
import reportsRoutes from "./reports.routes";
import notificationsRoutes from "./notifications.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/materials", materialsRoutes);
router.use("/vendors", vendorsRoutes);
router.use("/issues", issuesRoutes);
router.use("/receives", receivesRoutes);
router.use("/reports", reportsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/health", healthRoutes);

export default router;

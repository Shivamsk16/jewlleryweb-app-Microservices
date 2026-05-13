import { Router } from "express";
import * as auth from "../controllers/auth.controller";

const router = Router();

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/me", auth.me);

export default router;

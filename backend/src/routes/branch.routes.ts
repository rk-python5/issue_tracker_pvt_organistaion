import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth";
import { getBranches, createBranch, toggleBranch } from "../controllers/branch.controller";

const router = Router();

router.use(authenticateToken);

router.get("/", getBranches);
router.post("/", authorizeRoles("admin"), createBranch);
router.patch("/:id", authorizeRoles("admin"), toggleBranch);

export default router;

import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth";
import { getIssueTypes, createIssueType, toggleIssueType } from "../controllers/issueType.controller";

const router = Router();

router.use(authenticateToken);

router.get("/", getIssueTypes);
router.post("/", authorizeRoles("admin"), createIssueType);
router.patch("/:id", authorizeRoles("admin"), toggleIssueType);

export default router;

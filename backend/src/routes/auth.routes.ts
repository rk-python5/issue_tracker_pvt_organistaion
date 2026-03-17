import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth";
import { createUser, listUsers, login, resetUserPassword, toggleUserActive } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);

router.use(authenticateToken);
router.get("/users", authorizeRoles("admin"), listUsers);
router.post("/users", authorizeRoles("admin"), createUser);
router.patch("/users/:id/toggle-active", authorizeRoles("admin"), toggleUserActive);
router.post("/users/:id/reset-password", authorizeRoles("admin"), resetUserPassword);

export default router;

import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth";
import { createTicket, getTickets, resolveTicket } from "../controllers/ticket.controller";

const router = Router();

router.use(authenticateToken);

router.post("/", authorizeRoles("employee"), createTicket);
router.get("/", authorizeRoles("employee", "supervisor"), getTickets);
router.post("/:id/resolve", authorizeRoles("supervisor"), resolveTicket);

export default router;

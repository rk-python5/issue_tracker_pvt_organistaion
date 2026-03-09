import { Request, Response } from "express";
import pool from "../db/pool";

export async function createTicket(req: Request, res: Response): Promise<void> {
  const { branch_id, issue_type_id, description } = req.body;
  const employeeId = req.user!.id;

  if (!branch_id || !issue_type_id || !description?.trim()) {
    res.status(400).json({ error: "branch_id, issue_type_id, and description are required" });
    return;
  }

  try {
    // Verify branch is active
    const branchCheck = await pool.query("SELECT is_active FROM branches WHERE id = $1", [branch_id]);
    if (branchCheck.rows.length === 0 || !branchCheck.rows[0].is_active) {
      res.status(400).json({ error: "Invalid or inactive branch" });
      return;
    }

    // Verify issue type is active
    const issueCheck = await pool.query("SELECT is_active FROM issue_types WHERE id = $1", [issue_type_id]);
    if (issueCheck.rows.length === 0 || !issueCheck.rows[0].is_active) {
      res.status(400).json({ error: "Invalid or inactive issue type" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO tickets (employee_id, branch_id, issue_type_id, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, employee_id, branch_id, issue_type_id, description, status, created_at`,
      [employeeId, branch_id, issue_type_id, description.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create ticket error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTickets(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { status, branch_id } = req.query;

  try {
    let query = `
      SELECT
        t.id, t.description, t.status, t.created_at,
        u.display_name AS employee_name, u.id AS employee_id,
        b.name AS branch_name, b.id AS branch_id,
        it.name AS issue_type_name, it.id AS issue_type_id,
        r.remarks AS supervisor_remarks, r.resolved_at,
        sup.display_name AS resolved_by
      FROM tickets t
      JOIN users u ON t.employee_id = u.id
      JOIN branches b ON t.branch_id = b.id
      JOIN issue_types it ON t.issue_type_id = it.id
      LEFT JOIN resolutions r ON r.ticket_id = t.id
      LEFT JOIN users sup ON r.supervisor_id = sup.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIdx = 1;

    // Employee sees only their own tickets
    if (user.role === "employee") {
      query += ` AND t.employee_id = $${paramIdx++}`;
      params.push(user.id);
    }

    // Optional status filter
    if (status === "open" || status === "closed") {
      query += ` AND t.status = $${paramIdx++}`;
      params.push(status);
    }

    // Optional branch filter (mainly for supervisor)
    if (branch_id) {
      query += ` AND t.branch_id = $${paramIdx++}`;
      params.push(Number(branch_id));
    }

    query += " ORDER BY t.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Get tickets error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function resolveTicket(req: Request, res: Response): Promise<void> {
  const ticketId = Number(req.params.id);
  const supervisorId = req.user!.id;
  const { remarks } = req.body;

  if (!remarks?.trim()) {
    res.status(400).json({ error: "Resolution remarks are required" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check ticket exists and is open
    const ticketResult = await client.query(
      "SELECT id, status FROM tickets WHERE id = $1",
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      res.status(404).json({ error: "Ticket not found" });
      await client.query("ROLLBACK");
      return;
    }

    if (ticketResult.rows[0].status === "closed") {
      res.status(400).json({ error: "Ticket is already resolved" });
      await client.query("ROLLBACK");
      return;
    }

    // Close ticket
    await client.query("UPDATE tickets SET status = 'closed' WHERE id = $1", [ticketId]);

    // Create resolution record
    await client.query(
      `INSERT INTO resolutions (ticket_id, supervisor_id, remarks)
       VALUES ($1, $2, $3)`,
      [ticketId, supervisorId, remarks.trim()]
    );

    await client.query("COMMIT");
    res.json({ message: "Ticket resolved successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Resolve ticket error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

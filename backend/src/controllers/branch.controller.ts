import { Request, Response } from "express";
import pool from "../db/pool";

export async function getBranches(req: Request, res: Response): Promise<void> {
  try {
    const isAdmin = req.user?.role === "admin";
    const query = isAdmin
      ? "SELECT id, name, is_active, created_at FROM branches ORDER BY id"
      : "SELECT id, name, is_active, created_at FROM branches WHERE is_active = TRUE ORDER BY id";

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Get branches error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createBranch(req: Request, res: Response): Promise<void> {
  const { name } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: "Branch name is required" });
    return;
  }

  try {
    const result = await pool.query(
      "INSERT INTO branches (name) VALUES ($1) RETURNING id, name, is_active, created_at",
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create branch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function toggleBranch(req: Request, res: Response): Promise<void> {
  const branchId = Number(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE branches SET is_active = NOT is_active WHERE id = $1
       RETURNING id, name, is_active, created_at`,
      [branchId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Branch not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Toggle branch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

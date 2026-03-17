import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import pool from "../db/pool";
import { JwtPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash, display_name, role, is_active FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      res.status(403).json({ error: "User account is inactive" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const payload: JwtPayload = {
      id: user.id,
      role: user.role,
      username: user.username,
      displayName: user.display_name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, role, is_active, created_at
       FROM users
       WHERE role IN ('employee', 'supervisor')
       ORDER BY id`
    );

    const users = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));

    res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { username, displayName, password, role } = req.body;

  if (!username?.trim() || !displayName?.trim() || !password || !role) {
    res.status(400).json({ error: "username, displayName, password, and role are required" });
    return;
  }

  const normalizedRole = role === "employee" || role === "supervisor" ? role : null;
  if (!normalizedRole) {
    res.status(400).json({ error: "role must be employee or supervisor" });
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json({ error: "password must be at least 6 characters" });
    return;
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username.trim()]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, display_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, display_name, role, is_active, created_at`,
      [username.trim(), passwordHash, displayName.trim(), normalizedRole]
    );

    const user = result.rows[0];
    res.status(201).json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function toggleUserActive(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  try {
    const roleCheck = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
    if (roleCheck.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (roleCheck.rows[0].role === "admin") {
      res.status(400).json({ error: "Admin users cannot be modified from this endpoint" });
      return;
    }

    const result = await pool.query(
      `UPDATE users
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING id, username, display_name, role, is_active, created_at`,
      [userId]
    );

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error("Toggle user active error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function resetUserPassword(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id);
  const { password } = req.body;

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  if (!password || String(password).length < 6) {
    res.status(400).json({ error: "password must be at least 6 characters" });
    return;
  }

  try {
    const roleCheck = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
    if (roleCheck.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (roleCheck.rows[0].role === "admin") {
      res.status(400).json({ error: "Admin users cannot be modified from this endpoint" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

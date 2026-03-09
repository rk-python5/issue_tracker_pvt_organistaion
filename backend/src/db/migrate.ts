import pool from "./pool";
import fs from "fs";
import path from "path";

async function migrate() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, "migrations", "001_init.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await client.query(sql);
    console.log("✓ Migration completed successfully");
  } catch (err) {
    console.error("✗ Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

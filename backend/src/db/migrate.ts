import pool from "./pool";
import fs from "fs";
import path from "path";

async function migrate() {
  const client = await pool.connect();
  try {
    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, "utf-8");
      await client.query(sql);
      console.log(`✓ Applied migration: ${file}`);
    }

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

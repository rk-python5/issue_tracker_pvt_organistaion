import pool from "./pool";
import bcrypt from "bcryptjs";

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear existing data (in reverse FK order)
    await client.query("DELETE FROM resolutions");
    await client.query("DELETE FROM tickets");
    await client.query("DELETE FROM issue_types");
    await client.query("DELETE FROM branches");
    await client.query("DELETE FROM users");

    // Reset sequences
    await client.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE branches_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE issue_types_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE tickets_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE resolutions_id_seq RESTART WITH 1");

    // ─── Users ───
    const hash = (pw: string) => bcrypt.hashSync(pw, 10);

    const usersResult = await client.query(
      `INSERT INTO users (username, password_hash, display_name, role) VALUES
        ('admin',          $1, 'Admin',          'admin'),
        ('rahul.sharma',   $2, 'Rahul Sharma',   'supervisor'),
        ('priya.verma',    $3, 'Priya Verma',    'supervisor'),
        ('ankit.patel',    $4, 'Ankit Patel',    'employee'),
        ('neha.gupta',     $5, 'Neha Gupta',     'employee'),
        ('vikram.singh',   $6, 'Vikram Singh',   'employee'),
        ('sneha.reddy',    $7, 'Sneha Reddy',    'employee'),
        ('arjun.mehta',    $8, 'Arjun Mehta',    'employee')
      RETURNING id, username`,
      [
        hash("admin123"),
        hash("super123"),
        hash("super123"),
        hash("emp123"),
        hash("emp123"),
        hash("emp123"),
        hash("emp123"),
        hash("emp123"),
      ]
    );
    const users = Object.fromEntries(usersResult.rows.map((u) => [u.username, u.id]));
    console.log("✓ Users seeded:", Object.keys(users).join(", "));

    // ─── Branches ───
    const branchesResult = await client.query(
      `INSERT INTO branches (name, is_active) VALUES
        ('Mumbai HQ',         TRUE),
        ('Delhi Office',      TRUE),
        ('Bangalore Branch',  TRUE),
        ('Hyderabad Center',  FALSE),
        ('Pune Plaza',        TRUE),
        ('Chennai Hub',       TRUE)
      RETURNING id, name`
    );
    const branches = Object.fromEntries(branchesResult.rows.map((b) => [b.name, b.id]));
    console.log("✓ Branches seeded:", Object.keys(branches).join(", "));

    // ─── Issue Types ───
    const issueTypesResult = await client.query(
      `INSERT INTO issue_types (name, is_active) VALUES
        ('Hardware Malfunction',     TRUE),
        ('Software Bug',             TRUE),
        ('Network Issue',            TRUE),
        ('Access & Permissions',     TRUE),
        ('Facilities & Maintenance', TRUE),
        ('HR & Payroll',             FALSE),
        ('Security Incident',        TRUE)
      RETURNING id, name`
    );
    const issueTypes = Object.fromEntries(issueTypesResult.rows.map((it) => [it.name, it.id]));
    console.log("✓ Issue types seeded:", Object.keys(issueTypes).join(", "));

    // ─── Tickets ───
    const ticketsResult = await client.query(
      `INSERT INTO tickets (employee_id, branch_id, issue_type_id, description, status, created_at) VALUES
        ($1, $2, $3,  'Laptop screen flickering intermittently during video calls. Happens every 10-15 minutes.', 'open', '2026-03-07'),
        ($1, $2, $4,  'CRM dashboard not loading after the latest update. Getting a blank white screen.', 'closed', '2026-03-01'),
        ($5, $6, $7,  'WiFi drops every 30 minutes on the 3rd floor. Multiple employees affected.', 'open', '2026-03-06'),
        ($8, $9, $10, 'Unable to access shared drive after department transfer. Permission denied on all folders.', 'open', '2026-03-05'),
        ($11, $12, $13, 'Conference room B projector bulb burned out. Need replacement for client presentation on Friday.', 'open', '2026-03-07'),
        ($5, $6, $4,  'Excel macro for monthly reporting throwing runtime error 1004. Was working last week.', 'closed', '2026-02-28'),
        ($14, $15, $16, 'Suspicious login attempts on my account from an unrecognized IP address. Password changed but want investigation.', 'open', '2026-03-08'),
        ($1, $2, $7,  'VPN connection keeps timing out when working remotely. Unable to access internal tools.', 'closed', '2026-02-25'),
        ($17, $9, $3, 'Desk phone not receiving incoming calls. Outgoing calls work fine. Extension 4502.', 'open', '2026-03-07'),
        ($18, $12, $13, 'Air conditioning not working in the open office area. Temperature reaching 35°C by midday.', 'open', '2026-03-06')
      RETURNING id, status`,
      [
        // Ticket 1: Ankit Patel, Mumbai HQ, Hardware Malfunction
        users["ankit.patel"], branches["Mumbai HQ"], issueTypes["Hardware Malfunction"],
        // Ticket 2: (same params reused) + Software Bug
        issueTypes["Software Bug"],
        // Ticket 3: Neha Gupta, Delhi Office, Network Issue
        users["neha.gupta"], branches["Delhi Office"], issueTypes["Network Issue"],
        // Ticket 4: Vikram Singh, Bangalore Branch, Access & Permissions
        users["vikram.singh"], branches["Bangalore Branch"], issueTypes["Access & Permissions"],
        // Ticket 5: Sneha Reddy, Pune Plaza, Facilities & Maintenance
        users["sneha.reddy"], branches["Pune Plaza"], issueTypes["Facilities & Maintenance"],
        // Ticket 7: Arjun Mehta, Chennai Hub, Security Incident
        users["arjun.mehta"], branches["Chennai Hub"], issueTypes["Security Incident"],
        // Ticket 9: Sneha Reddy, Bangalore Branch, Hardware Malfunction
        users["sneha.reddy"],
        // Ticket 10: Vikram Singh, Pune Plaza, Facilities & Maintenance
        users["vikram.singh"],
      ]
    );
    const ticketIds = ticketsResult.rows;
    console.log(`✓ Tickets seeded: ${ticketIds.length} total`);

    // ─── Resolutions (for closed tickets: #2, #6, #8) ───
    const closedTickets = ticketIds.filter((t) => t.status === "closed");
    const remarks = [
      "Resolved by clearing browser cache and updating to the latest CRM version. Issue was caused by a stale service worker.",
      "Macro referenced a renamed worksheet. Updated the VBA code to use the new sheet name. Tested and confirmed working.",
      "VPN client was outdated. Pushed the latest version via MDM. User confirmed stable connection after update.",
    ];

    for (let i = 0; i < closedTickets.length; i++) {
      await client.query(
        `INSERT INTO resolutions (ticket_id, supervisor_id, remarks, resolved_at)
         VALUES ($1, $2, $3, $4)`,
        [
          closedTickets[i].id,
          users["rahul.sharma"],
          remarks[i],
          new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000).toISOString(),
        ]
      );
    }
    console.log(`✓ Resolutions seeded: ${closedTickets.length}`);

    await client.query("COMMIT");
    console.log("\n✓ All seed data inserted successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("✗ Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

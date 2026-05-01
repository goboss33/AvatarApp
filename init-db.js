const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

async function init() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR NOT NULL UNIQUE,
        password VARCHAR NOT NULL,
        name VARCHAR,
        created_at TIMESTAMP NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        heygen_api_key VARCHAR,
        updated_at TIMESTAMP NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS generations (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        mode VARCHAR NOT NULL,
        avatar_id VARCHAR,
        audio_asset_id VARCHAR,
        video_id VARCHAR,
        video_url VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP
      )
    `);

    const userCount = await pool.query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(userCount.rows[0].count);

    if (totalUsers === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await pool.query(
        "INSERT INTO users (id, email, password, name, created_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (id) DO NOTHING",
        ["seed-admin-001", "admin@example.com", hashedPassword, "Admin"]
      );
      await pool.query(
        "INSERT INTO settings (id, user_id, heygen_api_key, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (id) DO NOTHING",
        ["seed-settings-001", "seed-admin-001", null]
      );
      console.log("Default user created: admin@example.com / admin123");
    } else {
      console.log(`Database already has ${totalUsers} user(s), skipping seed.`);
    }
  } finally {
    await pool.end();
  }
}

init().catch((err) => {
  console.error("Init failed:", err);
  process.exit(1);
});

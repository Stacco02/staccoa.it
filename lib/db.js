const { sql } = require('@vercel/postgres');
const { randomUUID } = require('crypto');

let initialized = false;

async function ensureUsersTable() {
  if (initialized) {
    return;
  }
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  initialized = true;
}

function toSafeUser(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    nome: row.nome,
    cognome: row.cognome,
    email: row.email,
    createdAt: row.created_at,
  };
}

async function findUserByEmail(email) {
  await ensureUsersTable();
  const normalized = email.toLowerCase();
  const { rows } = await sql`SELECT id, nome, cognome, email, password_hash, created_at FROM users WHERE email = ${normalized} LIMIT 1`;
  return rows[0] || null;
}

async function findUserById(id) {
  await ensureUsersTable();
  const { rows } = await sql`SELECT id, nome, cognome, email, password_hash, created_at FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

async function createUser({ nome, cognome, email, passwordHash }) {
  await ensureUsersTable();
  const id = randomUUID();
  const normalized = email.toLowerCase();
  const { rows } = await sql`
    INSERT INTO users (id, nome, cognome, email, password_hash)
    VALUES (${id}, ${nome}, ${cognome}, ${normalized}, ${passwordHash})
    RETURNING id, nome, cognome, email, created_at;
  `;
  return rows[0];
}

module.exports = {
  ensureUsersTable,
  findUserByEmail,
  findUserById,
  createUser,
  toSafeUser,
};

const bcrypt = require('bcryptjs');
const { parseJsonBody, sendJson, methodNotAllowed, handleServerError } = require('../lib/http');
const { findUserByEmail, createUser, toSafeUser } = require('../lib/db');
const { signUserToken, setAuthCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const { nome, cognome, email, password } = await parseJsonBody(req);

    if (!nome || !cognome || !email || !password) {
      return sendJson(res, 400, { message: 'Tutti i campi sono obbligatori' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return sendJson(res, 409, { message: 'Email già registrata' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ nome, cognome, email, passwordHash });
    const token = signUserToken(user);
    setAuthCookie(res, token);

    return sendJson(res, 200, {
      message: 'Registrazione completata',
      user: toSafeUser(user),
    });
  } catch (error) {
    return handleServerError(res, error);
  }
};

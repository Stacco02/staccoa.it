const bcrypt = require('bcryptjs');
const { parseJsonBody, sendJson, methodNotAllowed, handleServerError } = require('../lib/http');
const { findUserByEmail, toSafeUser } = require('../lib/db');
const { signUserToken, setAuthCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const { email, password } = await parseJsonBody(req);
    if (!email || !password) {
      return sendJson(res, 400, { message: 'Email e password sono obbligatorie' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return sendJson(res, 401, { message: 'Credenziali non valide' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return sendJson(res, 401, { message: 'Credenziali non valide' });
    }

    const token = signUserToken(user);
    setAuthCookie(res, token);
    return sendJson(res, 200, { message: 'Accesso riuscito', user: toSafeUser(user) });
  } catch (error) {
    return handleServerError(res, error);
  }
};

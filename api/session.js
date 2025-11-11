const { sendJson, methodNotAllowed, handleServerError } = require('../lib/http');
const { getSessionFromRequest } = require('../lib/auth');
const { findUserById, toSafeUser } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return sendJson(res, 200, { authenticated: false });
    }
    const user = await findUserById(session.id);
    if (!user) {
      return sendJson(res, 200, { authenticated: false });
    }
    return sendJson(res, 200, { authenticated: true, user: toSafeUser(user) });
  } catch (error) {
    return handleServerError(res, error);
  }
};

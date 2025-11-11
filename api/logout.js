const { sendJson, methodNotAllowed } = require('../lib/http');
const { clearAuthCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }
  clearAuthCookie(res);
  return sendJson(res, 200, { message: 'Logout effettuato' });
};

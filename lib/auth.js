const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'staccoa_session';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 giorni
const AUTH_SECRET = process.env.AUTH_SECRET || 'staccoa-dev-secret';

function signUserToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, AUTH_SECRET, {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

function getCookieAttributes() {
  const attrs = ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${TOKEN_TTL_SECONDS}`];
  if (process.env.NODE_ENV === 'production') {
    attrs.push('Secure');
  }
  return attrs;
}

function setAuthCookie(res, token) {
  const attributes = getCookieAttributes();
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; ${attributes.join('; ')}`);
}

function clearAuthCookie(res) {
  const attributes = ['Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (process.env.NODE_ENV === 'production') {
    attributes.push('Secure');
  }
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${attributes.join('; ')}`);
}

function getTokenFromRequest(req) {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) {
    return null;
  }
  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const tokenCookie = cookies.find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
  if (!tokenCookie) {
    return null;
  }
  return tokenCookie.substring(COOKIE_NAME.length + 1);
}

function getSessionFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }
  try {
    return jwt.verify(token, AUTH_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  signUserToken,
  setAuthCookie,
  clearAuthCookie,
  getSessionFromRequest,
  COOKIE_NAME,
};

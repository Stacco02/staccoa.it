const express = require('express');
const path = require('path');
const registerHandler = require('./api/register');
const loginHandler = require('./api/login');
const logoutHandler = require('./api/logout');
const sessionHandler = require('./api/session');
const { getSessionFromRequest } = require('./lib/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function wrap(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

app.post('/api/register', wrap(registerHandler));
app.post('/api/login', wrap(loginHandler));
app.post('/api/logout', wrap(logoutHandler));
app.get('/api/session', wrap(sessionHandler));

app.get('/home.html', (req, res, next) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.redirect('/login.html');
  }
  return next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  res.status(404).json({ message: 'Risorsa non trovata' });
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});

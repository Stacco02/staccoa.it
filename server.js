const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'staccoa-it-secret';
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    },
  })
);

async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
      await fs.writeFile(USERS_FILE, '[]');
      return [];
    }
    throw err;
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  if (req.accepts('html')) {
    return res.redirect('/login.html');
  }
  return res.status(401).json({ message: 'Non autorizzato' });
}

function getSafeUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    cognome: user.cognome,
    email: user.email,
  };
}

app.post('/api/register', async (req, res) => {
  const { nome, cognome, email, password } = req.body;
  if (!nome || !cognome || !email || !password) {
    return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
  }

  try {
    const users = await readUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ message: 'Email già registrata' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      nome,
      cognome,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeUsers(users);

    req.session.userId = newUser.id;
    res.json({ message: 'Registrazione completata', user: getSafeUser(newUser) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore interno' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e password sono obbligatorie' });
  }

  try {
    const users = await readUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    req.session.userId = user.id;
    res.json({ message: 'Accesso riuscito', user: getSafeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore interno' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout effettuato' });
  });
});

app.get('/api/session', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ authenticated: false });
  }
  const users = await readUsers();
  const user = users.find((u) => u.id === req.session.userId);
  if (!user) {
    return res.json({ authenticated: false });
  }
  res.json({ authenticated: true, user: getSafeUser(user) });
});

app.get('/home.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  res.status(404).json({ message: 'Risorsa non trovata' });
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});

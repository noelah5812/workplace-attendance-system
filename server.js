// server.js
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session management
app.use(session({
  secret: 'attendance_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

// ✅ Register endpoint
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Check if username exists
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (row) return res.status(400).json({ message: 'Username already exists.' });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role],
        (err) => {
          if (err) return res.status(500).json({ message: 'Error creating user.' });
          res.status(201).json({ message: 'User registered successfully.' });
        }
      );
    } catch (e) {
      res.status(500).json({ message: 'Server error during registration.' });
    }
  });
});

// ✅ Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required.' });

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!user) return res.status(400).json({ message: 'Invalid username or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid username or password.' });

    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ message: 'Login successful', role: user.role });
  });
});

// ✅ Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully.' });
  });
});

// ✅ Protected route example
app.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in.' });
  res.json({ user: req.session.user });
});

// ✅ Fallback: serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

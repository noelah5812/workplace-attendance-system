const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Database path — allows easy change for production
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'attendance.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log(`✅ Connected to SQLite database at: ${DB_PATH}`);

    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) console.error('❌ Failed to enable foreign keys:', err.message);
      else console.log('🔗 Foreign key constraints enabled.');
    });
  }
});

db.serialize(() => {
  console.log('⚙️ Running database migrations...');

  // =====================
  // USERS TABLE
  // =====================
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('attachee', 'intern', 'staff', 'hr')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('❌ Error creating users table:', err.message);
    else console.log('✅ Users table ready.');
  });

  // =====================
  // ATTENDANCE TABLE
  // =====================
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      checkin_time TEXT,
      checkout_time TEXT,
      status TEXT DEFAULT 'Present' CHECK (status IN ('Present','Absent','Late')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    )
  `, (err) => {
    if (err) console.error('❌ Error creating attendance table:', err.message);
    else console.log('✅ Attendance table ready.');
  });

  // =====================
  // INDEXES (Performance)
  // =====================
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_role ON users(role);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);`);

  // =====================
  // DEFAULT HR USER
  // =====================
  const defaultHR = {
    username: 'root',
    password: '1234',
    role: 'hr'
  };

  db.get(`SELECT * FROM users WHERE username = ?`, [defaultHR.username], (err, row) => {
    if (err) {
      console.error('❌ Error checking for HR user:', err.message);
      return;
    }

    if (!row) {
      bcrypt.hash(defaultHR.password, 10, (err, hash) => {
        if (err) return console.error('❌ Error hashing password:', err.message);

        db.run(
          `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
          [defaultHR.username, hash, defaultHR.role],
          (err) => {
            if (err) {
              console.error('❌ Error inserting HR user:', err.message);
            } else {
              console.log(`✅ Default HR user created: ${defaultHR.username} / ${defaultHR.password}`);
            }
          }
        );
      });
    } else {
      console.log('ℹ️ Default HR user already exists.');
    }
  });

  // =====================
  // (Optional) SEED SAMPLE USERS
  // =====================
  const sampleUsers = [
    { username: 'attachee1', password: '1234', role: 'attachee' },
    { username: 'intern1', password: '1234', role: 'intern' },
    { username: 'staff1', password: '1234', role: 'staff' }
  ];

  sampleUsers.forEach((user) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [user.username], (err, row) => {
      if (!row) {
        bcrypt.hash(user.password, 10, (err, hash) => {
          if (!err) {
            db.run(
              `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
              [user.username, hash, user.role],
              (err) => {
                if (err) console.error(`❌ Error adding sample user ${user.username}:`, err.message);
                else console.log(`👤 Sample user created: ${user.username} (${user.role})`);
              }
            );
          }
        });
      }
    });
  });
});

module.exports = db;

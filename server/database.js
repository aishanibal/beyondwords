const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'users.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  // Create users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      target_language TEXT,
      proficiency_level TEXT,
      learning_goals TEXT,
      practice_preference TEXT,
      motivation TEXT,
      onboarding_complete BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create sessions table for chat history
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chat_history TEXT,
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `;

  db.serialize(() => {
    db.run(createUsersTable, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table ready');
        // Add new columns if they don't exist (for existing databases)
        addColumnsIfNotExist();
      }
    });

    db.run(createSessionsTable, (err) => {
      if (err) {
        console.error('Error creating sessions table:', err.message);
      } else {
        console.log('Sessions table ready');
      }
    });
  });
}

// Add new columns to existing databases
function addColumnsIfNotExist() {
  const newColumns = [
    'ALTER TABLE users ADD COLUMN target_language TEXT',
    'ALTER TABLE users ADD COLUMN proficiency_level TEXT',
    'ALTER TABLE users ADD COLUMN learning_goals TEXT',
    'ALTER TABLE users ADD COLUMN practice_preference TEXT',
    'ALTER TABLE users ADD COLUMN motivation TEXT',
    'ALTER TABLE users ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE'
  ];
  
  newColumns.forEach(sql => {
    db.run(sql, (err) => {
      // Ignore errors for columns that already exist
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding column:', err.message);
      }
    });
  });
}

// User functions
function createUser(userData) {
  return new Promise((resolve, reject) => {
    const { googleId, email, name, passwordHash, role = 'user' } = userData;
    
    const sql = `
      INSERT OR REPLACE INTO users (google_id, email, name, password_hash, role, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(sql, [googleId, email, name, passwordHash, role], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...userData });
      }
    });
  });
}

function findUserByGoogleId(googleId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE google_id = ?';
    
    db.get(sql, [googleId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function findUserById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function updateUser(id, updates) {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const sql = `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.run(sql, [...values, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

// Session functions
function saveSession(userId, chatHistory, language = 'en') {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR REPLACE INTO sessions (user_id, chat_history, language, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(sql, [userId, JSON.stringify(chatHistory), language], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

function getSession(userId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1';
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row) {
          row.chat_history = JSON.parse(row.chat_history);
        }
        resolve(row);
      }
    });
  });
}

function getAllSessions(userId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC';
    
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        rows.forEach(row => {
          row.chat_history = JSON.parse(row.chat_history);
        });
        resolve(rows);
      }
    });
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Close database connection
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}

module.exports = {
  db,
  createUser,
  findUserByGoogleId,
  findUserByEmail,
  findUserById,
  updateUser,
  saveSession,
  getSession,
  getAllSessions,
  closeDatabase,
  getAllUsers
}; 
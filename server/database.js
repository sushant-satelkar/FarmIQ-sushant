const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'farmiQ.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with users table
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table (updated schema - no username, aadhar, name)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'farmer',
          phone TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('Users table created successfully');
      });

      // Create index on email for faster lookups
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_users_email 
        ON users (email)
      `, (err) => {
        if (err) {
          console.error('Error creating index:', err);
          reject(err);
          return;
        }
        console.log('Index created successfully');
        resolve();
      });
      // Create forum_posts table
      db.run(`
        CREATE TABLE IF NOT EXISTS forum_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category TEXT NOT NULL,
          question TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('Error creating forum_posts table:', err);
      });

      // Create forum_replies table
      db.run(`
        CREATE TABLE IF NOT EXISTS forum_replies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          reply_text TEXT NOT NULL,
          replied_by TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (post_id) REFERENCES forum_posts(id)
        )
      `, (err) => {
        if (err) console.error('Error creating forum_replies table:', err);
      });
    });
  });
};

// Database helper functions
const dbHelpers = {
  // Insert a new user (no username, aadhar, name)
  insertUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { email, password_hash, role, phone } = userData;
      db.run(
        `INSERT INTO users (email, password_hash, role, phone) 
         VALUES (?, ?, ?, ?)`,
        [email, password_hash, role || 'farmer', phone || ''],
        function (err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              reject(new Error('Email already exists'));
            } else {
              reject(err);
            }
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Find user by role and email (for login)
  findUserByRoleAndEmail: (role, email) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE role = ? AND email = ?`,
        [role, email],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Find user  by email only
  findUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Find user by ID
  findUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, role, email, phone, created_at FROM users WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // ========== PROFILE HELPERS ==========

  // Insert a new profile (no username, aadhar, village, district, state)
  insertProfile: (profileData) => {
    return new Promise((resolve, reject) => {
      const { id, full_name, email, phone_number, language_pref } = profileData;
      db.run(
        `INSERT INTO profiles (id, full_name, email, phone_number, language_pref) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, full_name || '', email || '', phone_number || '', language_pref || 'en'],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id });
        }
      );
    });
  },

  // Find profile by user ID
  findProfileByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM profiles WHERE id = ?`,
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Update profile (no username, aadhar, village, district, state)
  updateProfile: (userId, profileData) => {
    return new Promise((resolve, reject) => {
      const { full_name, phone_number, language_pref } = profileData;
      db.run(
        `UPDATE profiles 
         SET full_name = ?, phone_number = ?, language_pref = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [full_name, phone_number, language_pref, userId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // ========== NGO SCHEMES HELPERS ==========

  // Get all NGO schemes
  getNgoSchemes: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM ngo_schemes ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },

  // Get NGO scheme by ID
  getNgoSchemeById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM ngo_schemes WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Create NGO scheme
  createNgoScheme: (data) => {
    return new Promise((resolve, reject) => {
      const { name, ministry, deadline, location, contact_number, no_of_docs_required, status, benefit_text, eligibility_text } = data;
      db.run(
        `INSERT INTO ngo_schemes (name, ministry, deadline, location, contact_number, no_of_docs_required, status, benefit_text, eligibility_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, ministry || '', deadline || '', location || '', contact_number || '', no_of_docs_required || 0, status || 'active', benefit_text || '', eligibility_text || ''],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Update NGO scheme
  updateNgoScheme: (id, data) => {
    return new Promise((resolve, reject) => {
      const { name, ministry, deadline, location, contact_number, no_of_docs_required, status, benefit_text, eligibility_text } = data;
      db.run(
        `UPDATE ngo_schemes 
         SET name = ?, ministry = ?, deadline = ?, location = ?, contact_number = ?, 
             no_of_docs_required = ?, status = ?, benefit_text = ?, eligibility_text = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [name, ministry, deadline, location, contact_number, no_of_docs_required, status, benefit_text, eligibility_text, id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Delete NGO scheme
  deleteNgoScheme: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM ngo_schemes WHERE id = ?`,
        [id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // ========== SOIL LAB HELPERS ==========

  // Get all soil labs
  getSoilLabs: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM soil_lab ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },

  // Get soil lab by ID
  getSoilLabById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM soil_lab WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Create soil lab
  createSoilLab: (data) => {
    return new Promise((resolve, reject) => {
      const { name, location, contact_number, price, rating, tag } = data;
      db.run(
        `INSERT INTO soil_lab (name, location, contact_number, price, rating, tag)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, location || '', contact_number || '', price || 0, rating || 0, tag || ''],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Update soil lab
  updateSoilLab: (id, data) => {
    return new Promise((resolve, reject) => {
      const { name, location, contact_number, price, rating, tag } = data;
      db.run(
        `UPDATE soil_lab 
         SET name = ?, location = ?, contact_number = ?, price = ?, rating = ?, tag = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [name, location, contact_number, price, rating, tag, id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Delete soil lab
  deleteSoilLab: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM soil_lab WHERE id = ?`,
        [id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // ========== CROP HISTORY HELPERS ==========

  // Get crops by user ID (for farmers)
  getCropsByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM crop_history WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },

  // Get all crops (for admins)
  getAllCrops: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM crop_history ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },

  // Get crop by ID
  getCropById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM crop_history WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Create crop (user_id from server, never from client)
  createCrop: (userId, data) => {
    return new Promise((resolve, reject) => {
      const { crop_name, crop_price, selling_price, crop_produced_kg } = data;
      db.run(
        `INSERT INTO crop_history (user_id, crop_name, crop_price, selling_price, crop_produced_kg)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, crop_name, crop_price || 0, selling_price || 0, crop_produced_kg || 0],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Update crop
  updateCrop: (id, data) => {
    return new Promise((resolve, reject) => {
      const { crop_name, crop_price, selling_price, crop_produced_kg } = data;
      db.run(
        `UPDATE crop_history 
         SET crop_name = ?, crop_price = ?, selling_price = ?, crop_produced_kg = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [crop_name, crop_price, selling_price, crop_produced_kg, id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Delete crop
  deleteCrop: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM crop_history WHERE id = ?`,
        [id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Get all farmers
  getFarmers: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.id, p.full_name as name, p.email, p.phone_number as mobile,
                p.crops_grown, p.available_quantity, p.location, p.expected_price
         FROM profiles p
         JOIN users u ON p.id = u.id
         WHERE u.role = 'farmer'`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },
  // ========== FORUM HELPERS ==========

  // Get all forum posts with replies
  getForumPosts: () => {
    return new Promise((resolve, reject) => {
      // First get all posts
      db.all(
        `SELECT fp.id, fp.user_id, fp.category, fp.question, fp.created_at, p.full_name as farmer_name
         FROM forum_posts fp
         LEFT JOIN profiles p ON fp.user_id = p.id
         ORDER BY fp.created_at DESC`,
        [],
        (err, posts) => {
          if (err) {
            reject(err);
            return;
          }

          if (!posts || posts.length === 0) {
            resolve([]);
            return;
          }

          // Then get all replies
          db.all(
            `SELECT * FROM forum_replies ORDER BY created_at ASC`,
            [],
            (err, replies) => {
              if (err) {
                reject(err);
                return;
              }

              // Map replies to posts
              const postsWithReplies = posts.map(post => {
                return {
                  ...post,
                  replies: replies.filter(reply => reply.post_id === post.id)
                };
              });

              resolve(postsWithReplies);
            }
          );
        }
      );
    });
  },

  // Create forum post
  createForumPost: (userId, category, question) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO forum_posts (user_id, category, question) VALUES (?, ?, ?)`,
        [userId, category, question],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Create forum reply
  createForumReply: (postId, replyText, repliedBy) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO forum_replies (post_id, reply_text, replied_by) VALUES (?, ?, ?)`,
        [postId, replyText, repliedBy],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  }
};


module.exports = {
  db,
  initDatabase,
  dbHelpers
};

// index.js (safer version)
require('dotenv').config();
const express = require('express');

function safeRequire(path) {
  try {
    return require(path);
  } catch (err) {
    console.warn(`[safeRequire] Optional module not found or errored: ${path}\n  ${err.message}`);
    return null;
  }
}

const pool = safeRequire('./db');            // may return null if db module errors
const authRoutes = safeRequire('./routes/auth');
const postRoutes = safeRequire('./routes/posts');
const userRoutes = safeRequire('./routes/users');
const feedRoutes = safeRequire('./routes/feed'); // optional

let helmet, cors;
try { helmet = require('helmet'); } catch(e){ helmet = null; console.warn('helmet not installed'); }
try { cors = require('cors'); } catch(e){ cors = null; console.warn('cors not installed'); }

const app = express();

// Basic middlewares (only apply if module exists)
if (helmet) app.use(helmet());
if (cors) app.use(cors());
app.use(express.json());

// Simple logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// Public routes
if (authRoutes) app.use('/auth', authRoutes);
else console.warn('No auth routes loaded. Create routes/auth.js');

// Protected / resource routes (only mount if route modules exist)
if (postRoutes) app.use('/posts', postRoutes);
else console.warn('No post routes loaded. Create routes/posts.js');

if (userRoutes) app.use('/users', userRoutes);
else console.warn('No user routes loaded. Create routes/users.js');

if (feedRoutes) app.use('/feed', feedRoutes);
else console.warn('No feed routes loaded (this is optional).');

// Health check
app.get('/', (req, res) => res.json({ ok: true, msg: 'API running' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error handler:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Internal server error' });
});

// global error handlers for uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION', err && err.stack ? err.stack : err);
  // optionally process.exit(1) in production after logging
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION', reason && reason.stack ? reason.stack : reason);
});

// Start server after quick DB check if pool exists
const PORT = process.env.PORT || 4000;

(async () => {
  if (pool) {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      console.log('✅ MySQL connected');
    } catch (e) {
      console.warn('⚠️ DB connect warning:', e && e.message ? e.message : e);
      // do NOT throw — continue so the app can run for route development
    }
  } else {
    console.warn('DB pool not loaded — proceeding without DB connection (routes that use DB will fail)');
  }

  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
})();

// controllers/postController.js
const pool = require('../db');

exports.createPost = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 1; // fallback if no auth for quick test
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query('INSERT INTO posts (user_id, content) VALUES (?, ?)', [userId, content]);
      const postId = r.insertId;
      await conn.query('INSERT INTO activity (type, actor_id, post_id) VALUES (?, ?, ?)', ['post', userId, postId]);
      await conn.commit();
      res.status(201).json({ id: postId });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const postId = parseInt(req.params.id, 10);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('INSERT IGNORE INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      await conn.query('INSERT INTO activity (type, actor_id, post_id) VALUES (?, ?, ?)', ['like', userId, postId]);
      await conn.commit();
      res.json({ ok: true });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('likePost error:', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
};

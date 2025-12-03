const pool = require('../db');

exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const offset = page * limit;

    const sql = `
      SELECT a.id, a.type, a.actor_id, u.username AS actor_name,
             a.target_user_id, tu.username AS target_username,
             a.post_id, p.content AS post_content, a.meta, a.created_at
      FROM activity a
      LEFT JOIN users u ON a.actor_id = u.id
      LEFT JOIN users tu ON a.target_user_id = tu.id
      LEFT JOIN posts p ON a.post_id = p.id
      WHERE NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE (b.blocker_id = a.actor_id AND b.blocked_id = ?)  
           OR (b.blocker_id = ? AND b.blocked_id = a.actor_id)  
      )
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?`;

    const [rows] = await pool.query(sql, [userId, userId, limit, offset]);

    const result = rows.map(r => ({
      id: r.id,
      type: r.type,
      actor: { id: r.actor_id, username: r.actor_name },
      target_user: r.target_user_id ? { id: r.target_user_id, username: r.target_username } : null,
      post: r.post_id ? { id: r.post_id, content: r.post_content } : null,
      meta: r.meta ? JSON.parse(r.meta) : null,
      created_at: r.created_at
    }));

    res.json({ page, limit, data: result });
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ error: 'Could not fetch feed' });
  }
};

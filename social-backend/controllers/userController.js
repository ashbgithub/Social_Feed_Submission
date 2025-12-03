// controllers/userController.js
const pool = require('../db');

//
// Follow User
//
exports.followUser = async (req, res) => {
  const follower = req.user.id;
  const following = parseInt(req.params.id, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
      [follower, following]
    );
    await conn.query(
      'INSERT INTO activity (type, actor_id, target_user_id) VALUES (?, ?, ?)',
      ['follow', follower, following]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error('followUser error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

//
// Block User
//
exports.blockUser = async (req, res) => {
  const blocker = req.user.id;
  const blocked = parseInt(req.params.id, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'INSERT IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)',
      [blocker, blocked]
    );
    await conn.query(
      'INSERT INTO activity (type, actor_id, target_user_id) VALUES (?, ?, ?)',
      ['block', blocker, blocked]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error('blockUser error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

//
// ADMIN / OWNER FEATURES BELOW
//

// Delete a user (admin or owner) — insert activity BEFORE deleting so FK is valid
exports.deleteUser = async (req, res) => {
  const actorId = req.user.id;             // admin/owner performing action
  const targetId = parseInt(req.params.id, 10);

  if (actorId === targetId) {
    return res.status(400).json({ error: "You cannot delete yourself" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // optional: check that target exists
    const [users] = await conn.query('SELECT id, username, role FROM users WHERE id = ?', [targetId]);
    if (users.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Target user not found' });
    }

    // 1) log activity first while target still exists
    await conn.query(
      'INSERT INTO activity (type, actor_id, target_user_id) VALUES (?, ?, ?)',
      ['user_deleted', actorId, targetId]
    );

    // 2) delete user (ON DELETE CASCADE / SET NULL will run now)
    await conn.query('DELETE FROM users WHERE id = ?', [targetId]);

    await conn.commit();
    res.json({ ok: true, deletedUser: targetId });
  } catch (err) {
    await conn.rollback();
    console.error('deleteUser error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// Owner makes a user admin
exports.makeAdmin = async (req, res) => {
  const ownerId = req.user.id;
  const targetId = parseInt(req.params.id, 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT id FROM users WHERE id = ?', [targetId]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Target user not found' });
    }

    await conn.query('UPDATE users SET role = ? WHERE id = ?', ['admin', targetId]);
    await conn.query(
      'INSERT INTO activity (type, actor_id, target_user_id, meta) VALUES (?, ?, ?, ?)',
      ['user_role_change', ownerId, targetId, JSON.stringify({ new_role: 'admin' })]
    );

    await conn.commit();
    res.json({ ok: true, userId: targetId, newRole: 'admin' });
  } catch (err) {
    await conn.rollback();
    console.error('makeAdmin error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// Owner removes admin role
exports.revokeAdmin = async (req, res) => {
  const ownerId = req.user.id;
  const targetId = parseInt(req.params.id, 10);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT id, role FROM users WHERE id = ?', [targetId]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (rows[0].role !== 'admin') {
      await conn.rollback();
      return res.status(400).json({ error: 'User is not an admin' });
    }

    await conn.query('UPDATE users SET role = ? WHERE id = ?', ['user', targetId]);
    await conn.query(
      'INSERT INTO activity (type, actor_id, target_user_id, meta) VALUES (?, ?, ?, ?)',
      ['user_role_change', ownerId, targetId, JSON.stringify({ new_role: 'user' })]
    );

    await conn.commit();
    res.json({ ok: true, userId: targetId, newRole: 'user' });
  } catch (err) {
    await conn.rollback();
    console.error('revokeAdmin error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

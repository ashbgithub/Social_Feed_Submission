// routes/users.js
const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');

// Follow & block (any logged-in user)
router.post('/:id/follow', auth, userCtrl.followUser);
router.post('/:id/block', auth, userCtrl.blockUser);

// Admin or Owner: delete a user
router.delete('/:id', auth, roles(['admin', 'owner']), userCtrl.deleteUser);

// Owner only: promote/demote admins
router.post('/:id/make-admin', auth, roles(['owner']), userCtrl.makeAdmin);
router.post('/:id/revoke-admin', auth, roles(['owner']), userCtrl.revokeAdmin);

module.exports = router;

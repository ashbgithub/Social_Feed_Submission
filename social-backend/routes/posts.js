// routes/posts.js
const express = require('express');
const router = express.Router();

// optional: require auth if you implemented it
// const auth = require('../middlewares/auth');
// router.use(auth); // uncomment to require auth for all post routes

const postsCtrl = require('../controllers/postController');

// create post
router.post('/', postsCtrl.createPost);

// like post
router.post('/:id/like', postsCtrl.likePost);

// delete post (admin example)
// router.delete('/:id', postsCtrl.deletePost);

module.exports = router;

const express = require('express');
const router =  express.Router();

const {
    createPost,
    getPosts,
    deletePost,
    editPost,
    createComments,
    deleteComment,
    editComment,
    getComment
} = require('../controllers/postController');
const {auth} = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/create-post', auth, upload.single("image"), createPost);
router.get('/posts', auth, getPosts);
router.delete('delete-post/:postId', auth, deletePost);
router.put('edit-post/:postId', auth, editPost);
router.post('/create-comment/:postId', auth, upload.none(), createComments);
router.get('/comments/:postId', auth, getComment);
router.delete('/delete-comment/:commentId', auth, deleteComment);
router.put('/edit-comment/:commentId', auth, editComment)

module.exports = router;
const express = require('express');
const router = express.Router();

const {
     registerUser,
    verifiedEmail,
    resendEmailToken,
    loginUser,
    forgotPassword,
    resetPassword,
    updatePassword,
    userProfile,
    validation

} = require('../controllers/authController');
const upload = require('../middlewares/uploadMiddleware');
const {auth, refreshToken, logout} = require('../middlewares/authMiddleware');


router.post('/register',  upload.single('profileImage'), validation, registerUser);
router.get('/verify-email/:token', verifiedEmail);
router.post('/resend-email-token', resendEmailToken);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/update-password', auth, updatePassword);
router.get('/profile', auth, userProfile);

module.exports = router
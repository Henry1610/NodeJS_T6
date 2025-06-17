const express = require('express');

const authController = require('../controllers/auth');
const isNotAuth = require('../middleware/auth').isNotAuth;

const router = express.Router();

// Trang đăng nhập
router.get('/login', isNotAuth, authController.getLogin);
router.post('/login', isNotAuth, authController.postLogin);

// Trang đăng ký
router.get('/register', isNotAuth, authController.getRegister);
router.post('/register', isNotAuth, authController.postRegister);

// Quên mật khẩu
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);

// Đăng xuất
router.post('/logout', authController.postLogout);
router.get('/logout', authController.postLogout);

// Trang lỗi 403 - Không có quyền truy cập
router.get('/403', (req, res) => {
  res.status(403).render('403', { 
    title: 'Không có quyền truy cập',
    layout: false 
  });
});

module.exports = router; 
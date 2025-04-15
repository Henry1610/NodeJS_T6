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

// Đăng xuất
router.post('/logout', authController.postLogout);

module.exports = router; 
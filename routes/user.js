const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

// Trang chủ cho người dùng
router.get('/', userController.getHomePage);

// Trang sản phẩm
router.get('/products', userController.getProducts);
router.get('/product/:productId', userController.getProductDetail);

// Trang danh mục sản phẩm
router.get('/category/:categoryId', userController.getProductsByCategory);

// Trang hồ sơ người dùng (yêu cầu đăng nhập)
router.get('/profile', authMiddleware.isAuth, userController.getProfile);

// Trang đơn hàng (yêu cầu đăng nhập)
router.get('/orders', authMiddleware.isAuth, orderController.getUserOrders);
router.get('/order/:orderId', authMiddleware.isAuth, orderController.getUserOrderDetail);
router.post('/order/:orderId/cancel', authMiddleware.isAuth, orderController.cancelOrder);

// Trang thông tin khác
router.get('/about', userController.getAboutPage);
router.get('/contact', userController.getContactPage);
router.get('/faq', userController.getFaqPage);
router.get('/shipping', userController.getShippingInfo);

// Trang search
router.get('/search', userController.searchProducts);

// Giỏ hàng (yêu cầu đăng nhập)
router.get('/cart', authMiddleware.isAuth, userController.getCart);
router.post('/cart/add', authMiddleware.isAuth, userController.addToCart);
router.post('/cart/remove', authMiddleware.isAuth, userController.removeFromCart);
router.post('/cart/update-quantity', authMiddleware.isAuth, userController.updateCartQuantity);

module.exports = router; 
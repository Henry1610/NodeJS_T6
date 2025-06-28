const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const Discount = require('../models/Discount');

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

// Trang checkout (yêu cầu đăng nhập)
router.get('/checkout', authMiddleware.isAuth, userController.getCheckoutPage);

// API lấy danh sách mã giảm giá khả dụng cho giỏ hàng
router.get('/cart/available-discounts', authMiddleware.isAuth, async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.fetchAll();
    // Lọc các mã còn hiệu lực, đang active, trong thời gian áp dụng
    const available = discounts.filter(d =>
      d.is_active &&
      now >= new Date(d.start_date) &&
      now <= new Date(d.end_date)
    );
    res.json({ discounts: available });
  } catch (err) {
    res.status(500).json({ discounts: [] });
  }
});

module.exports = router; 
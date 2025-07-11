const path = require('path');
const express = require('express');
const rootDir = require('../util/path');
const adminController = require('../controllers/admin');
const categoryController = require('../controllers/categoryController');
const brandController = require('../controllers/brandController');
const orderController = require('../controllers/orderController');
const upload = require('../middleware/file-upload');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Middleware để kiểm tra quyền admin cho tất cả các route trong admin
router.use(authMiddleware.isAuth);
router.use(authMiddleware.isAdmin);

router.get('/dashboard', adminController.getProductStatistics);
// ==========================
// PRODUCT ROUTES
// ==========================
router.get('/addproduct', adminController.getAddProduct);
router.post('/addproduct', upload.single('image'), adminController.postAddProduct);

router.get('/products', adminController.getProducts);
router.get('/productlist', adminController.getProductList);
router.get('/productdetail/:productId', adminController.getProductDetail);
router.get('/product-statistics', adminController.getProductStatistics);
router.get('/product-search', adminController.searchProducts);

router.get('/editproduct/:productId', adminController.getEditProduct);
router.post('/editproduct', upload.single('image'), adminController.postEditProduct);

router.post('/delete-product', adminController.postDeleteProduct);

// ==========================
// CATEGORY ROUTES
// ==========================
router.get('/categorylist', categoryController.getCategoryList);
router.get('/addcategory', categoryController.getAddCategory);
router.post('/addcategory', categoryController.postAddCategory);
router.get('/editcategory/:id', categoryController.getEditCategory);
router.post('/editcategory/:id', categoryController.postEditCategory);
router.get('/deletecategory/:id', categoryController.deleteCategory);

// ==========================
// BRAND ROUTES
// ==========================
router.get('/brandlist', brandController.getBrandList);
router.get('/addbrand', brandController.getAddBrand);
router.post('/addbrand', brandController.postAddBrand);
router.get('/editbrand/:id', brandController.getEditBrand);
router.post('/editbrand/:id', brandController.postEditBrand);
router.get('/deletebrand/:id', brandController.deleteBrand);

// ==========================
// ORDER ROUTES
// ==========================
router.get('/orders', orderController.getAllOrders);
router.get('/order/:orderId', orderController.getOrderDetail);
router.post('/order/:orderId/update-status', orderController.updateOrderStatus);

// ==========================
// REFUND ROUTES
// ==========================
router.get('/refund/:orderId', orderController.getRefundInfo);
router.post('/update-refund-status/:orderId', orderController.updateRefundStatus);

// ==========================
// CANCEL REQUEST ROUTES
// ==========================
router.get('/cancel-requests', orderController.getCancelRequests);
router.post('/cancel-request/:requestId/process', orderController.processCancelRequest);

// ==========================
// OTHER ROUTES / TEST
// ==========================
// router.get('/test', (req, res) => {
//     res.render('admin/dashboard');
// });



// ==========================
// ERROR HANDLING
// ==========================
router.get('/404', (req, res) => {
    res.render('404', {
        title: 'Lỗi',
        layout: false
    });
});

router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(404).render('404', {
        title: 'Lỗi',
        error: err,
        layout: false
    });
});

exports.router = router;

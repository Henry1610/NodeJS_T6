const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/User');
const ejsMate = require('ejs-mate');
const expressLayouts = require('express-ejs-layouts');
const bcrypt = require('bcryptjs');
const userController = require('./controllers/userController');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);
const {VNPay,ingnoreLogger,ProductCode,dateFormat} = require('vnpay');

const VNPayLocale = {
  VN: 'vn',
  EN: 'en'
};

const app = express();

// Cấu hình middleware trước
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());  // Thêm parser cho JSON payloads

// Route VNPay API
app.post('/api/create-qr', async (req, res) => {
  try {
    const { amount, orderId, orderInfo } = req.body;
    
    // Validate input
    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin số tiền hoặc mã đơn hàng'
      });
    }

    const vnpay = new VNPay({
      tmnCode: 'PX2DIOF7',
      secureSecret: '19A2ZLVXKMDZ0YIJ2DDPYAY8LPB7I8FF',
      vnpayHost: 'https://sandbox.vnpayment.vn/',
      testMode: true,
      hashAlgorithm: 'SHA512',
      logger: fn => fn,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: amount, // KHÔNG nhân 100 nữa, client đã gửi đúng số tiền VNĐ x 100
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: 'http://localhost:3000/api/check-payment-vnpay',
      vnp_Locale: VNPayLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json({
      success: true,
      data: vnpayResponse
    });
  } catch (error) {
    console.error('Lỗi tạo QR code:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tạo QR code thanh toán'
    });
  }
});

app.get('/api/check-payment-vnpay', (req, res) => {
  console.log('VNPay callback data:', req.query);
  
  // Kiểm tra response code
  const vnp_ResponseCode = req.query.vnp_ResponseCode;
  const vnp_Amount = req.query.vnp_Amount;
  const vnp_TxnRef = req.query.vnp_TxnRef;
  
  console.log('vnp_TxnRef:', vnp_TxnRef); // Thêm logging
  
  if (vnp_ResponseCode === '00') {
    // Thanh toán thành công
    const amount = parseInt(vnp_Amount) / 100; // Chia cho 100 để lấy số tiền thực
    
    if (vnp_TxnRef) {
      return res.redirect(`/user/checkout/success/${vnp_TxnRef}?payment=vnpay&amount=${amount}`);
    } else {
      // Nếu không có TxnRef, chuyển hướng về trang đơn hàng
      return res.redirect(`/user/orders?success=Thanh toán VNPay thành công`);
    }
  } else {
    // Thanh toán thất bại
    if (vnp_TxnRef) {
      return res.redirect(`/user/checkout?error=payment_failed&orderId=${vnp_TxnRef}`);
    } else {
      return res.redirect(`/user/checkout?error=payment_failed`);
    }
  }
});

// VNPay refund callback endpoint
app.get('/api/check-refund-vnpay', async (req, res) => {
  console.log('VNPay refund callback data:', req.query);
  
  const vnp_ResponseCode = req.query.vnp_ResponseCode;
  const vnp_TxnRef = req.query.vnp_TxnRef;
  const vnp_Amount = req.query.vnp_Amount;
  
  try {
    const Order = require('./models/Order');
    
    if (vnp_ResponseCode === '00') {
      // Hoàn tiền thành công
      const refundAmount = parseInt(vnp_Amount) / 100;
      
      // Cập nhật trạng thái hoàn tiền trong database
      await Order.updateRefundStatus(vnp_TxnRef, 'completed', {
        completedAt: new Date(),
        responseCode: vnp_ResponseCode
      });
      
      console.log(`VNPay refund successful for ${vnp_TxnRef}, amount: ${refundAmount}`);
      return res.redirect('/admin/cancel-requests?success=Hoàn tiền VNPay thành công');
    } else {
      // Hoàn tiền thất bại
      await Order.updateRefundStatus(vnp_TxnRef, 'failed', {
        failedAt: new Date(),
        responseCode: vnp_ResponseCode,
        errorMessage: req.query.vnp_Message || 'Hoàn tiền thất bại'
      });
      
      console.log(`VNPay refund failed for ${vnp_TxnRef}, response code: ${vnp_ResponseCode}`);
      return res.redirect('/admin/cancel-requests?error=Hoàn tiền VNPay thất bại');
    }
  } catch (error) {
    console.error('Lỗi xử lý callback hoàn tiền VNPay:', error);
    return res.redirect('/admin/cancel-requests?error=Lỗi xử lý hoàn tiền');
  }
});

// Route test để kiểm tra VNPay callback
app.get('/test-vnpay-callback', (req, res) => {
  console.log('Test VNPay callback - All query params:', req.query);
  res.json({
    message: 'Test VNPay callback received',
    query: req.query
  });
});

// Route test để tạo hoàn tiền VNPay
app.post('/api/test-refund', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã đơn hàng'
      });
    }

    const Order = require('./models/Order');
    const order = await Order.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (!order.paymentInfo || order.paymentInfo.method !== 'VNPay') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng không thanh toán qua VNPay'
      });
    }

    const {VNPay, ProductCode, dateFormat} = require('vnpay');
    
    const vnpay = new VNPay({
      tmnCode: 'PX2DIOF7',
      secureSecret: '19A2ZLVXKMDZ0YIJ2DDPYAY8LPB7I8FF',
      vnpayHost: 'https://sandbox.vnpayment.vn/',
      testMode: true,
      hashAlgorithm: 'SHA512',
      logger: fn => fn,
    });

    const refundTxnRef = `TEST_REFUND_${order._id}_${Date.now()}`;
    const refundAmount = Math.round(order.paymentInfo.finalAmount * 100);
    
    const refundUrl = await vnpay.buildRefundUrl({
      vnp_Amount: refundAmount,
      vnp_OrderInfo: `Test hoan tien don hang ${order._id}`,
      vnp_OrderType: ProductCode.Other,
      vnp_TxnRef: refundTxnRef,
      vnp_TransactionType: '02',
      vnp_TransactionNo: order._id.toString(),
      vnp_CreateDate: dateFormat(new Date()),
      vnp_IpAddr: '127.0.0.1',
      vnp_ReturnUrl: 'http://localhost:3000/api/check-refund-vnpay'
    });

    await Order.saveRefundInfo(order._id, {
      refundTxnRef: refundTxnRef,
      refundAmount: order.paymentInfo.finalAmount,
      refundUrl: refundUrl,
      refundStatus: 'pending',
      refundDate: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Tạo URL hoàn tiền thành công',
      refundUrl: refundUrl,
      refundTxnRef: refundTxnRef
    });
  } catch (error) {
    console.error('Lỗi test hoàn tiền:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tạo URL hoàn tiền: ' + error.message
    });
  }
});

//Khai báo engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', 'views')

// Cấu hình express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main_layout'); // Layout mặc định

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const { log } = require('console');

app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình session đơn giản
app.use(session({
  secret: 'my secret',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Middleware xử lý flash messages
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Middleware để thiết lập layout dựa trên URL
app.use((req, res, next) => {
  // Kiểm tra URL để xác định layout
  if (req.originalUrl.startsWith('/admin')) {
    // Sử dụng layout admin cho tất cả các trang admin
    app.set('layout', 'layouts/admin_layout');
  } else if (req.originalUrl.startsWith('/user') || req.originalUrl === '/' || req.originalUrl === '/login' || req.originalUrl === '/register' || req.originalUrl === '/forgot-password') {
    // Sử dụng layout user cho tất cả các trang user và các trang auth
    app.set('layout', 'layouts/user_layout');
  } else {
    // Sử dụng layout user cho các trang còn lại (thay vì main_layout đã bị xóa)
    app.set('layout', 'layouts/user_layout');
  }
  
  // Thiết lập locals cho view
  res.locals.path = req.originalUrl;
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.isAdmin = req.session.isLoggedIn && req.session.user && req.session.user.role === 'admin';
  res.locals.user = req.session.user;
  
  next();
});

// Middleware xử lý thông báo và dữ liệu sản phẩm từ URL
app.use((req, res, next) => {
  // Xử lý thông báo thành công
  if (req.query.success) {
    res.locals.success = req.query.success;
  }
  
  // Xử lý thông báo lỗi
  if (req.query.error) {
    res.locals.error = req.query.error;
  }
  
  // Xử lý dữ liệu sản phẩm
  if (req.query.productData) {
    try {
      res.locals.productData = JSON.parse(req.query.productData);
    } catch (error) {
      console.error('Lỗi khi parse productData:', error);
    }
  }
  
  next();
});

// Route mặc định cho đường dẫn /
app.get('/', (req, res) => {
  if (req.session.isLoggedIn) {
    // Kiểm tra vai trò và chuyển hướng phù hợp
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/user');
    }
  } else {
    // Người dùng chưa đăng nhập
    return res.redirect('/user');
  }
});

app.use('/admin', adminRoutes.router);
app.use('/user', userRoutes);
app.use(authRoutes);

// Chỉ giữ lại route thanh toán - các route đơn hàng đã được xử lý trong userRoutes
app.post('/user/checkout', userController.checkout);
app.get('/user/checkout/success/:orderId', userController.getOrderSuccess);

// Middleware để xử lý lỗi JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Lỗi cú pháp JSON'
    });
  }
  next(err);
});

mongoConnect()
    .then(async () => {
        // Tạo tài khoản mặc định khi khởi động ứng dụng
        try {
            // Tạo tài khoản admin mặc định
            const adminEmail = 'admin@example.com';
            const adminPassword = '123456';
            
            const existingAdmin = await User.findByEmail(adminEmail);
            
            if (!existingAdmin) {
                // Nếu chưa có tài khoản admin, tạo mới
                const hashedPassword = await bcrypt.hash(adminPassword, 12);
                const adminUser = new User(adminEmail, hashedPassword, 'admin');
                await adminUser.save();
            } else if (existingAdmin.role !== 'admin') {
                // Nếu tài khoản tồn tại nhưng không phải admin, cập nhật quyền
                existingAdmin.role = 'admin';
                const adminUser = new User(
                    existingAdmin.email, 
                    existingAdmin.password, 
                    'admin',
                    existingAdmin._id
                );
                await adminUser.save();
            }
            
            // Tạo tài khoản user mặc định
            const userEmail = 'user@example.com';
            const userPassword = '123456';
            
            const existingUser = await User.findByEmail(userEmail);
            
            if (!existingUser) {
                // Nếu chưa có tài khoản user, tạo mới
                const hashedPassword = await bcrypt.hash(userPassword, 12);
                const normalUser = new User(userEmail, hashedPassword, 'user');
                await normalUser.save();
            }
        } catch (err) {
            console.error('Lỗi khi tạo tài khoản mặc định:', err);
        }
        
        app.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    })
    .catch(err => {
        console.error('Failed to start server:', err);
    });

app.use((req, res, next) => {
    res.status(404).render('404', { title: 'Lỗi', layout: false });
});


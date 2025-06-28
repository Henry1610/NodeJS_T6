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
const {VNPay,ingnoreLogger,ProductCode,VNPayLocale,dateFormat} = require('vnpay');


const app = express();
app.post('/api/create-qr', async (req, res) => {
  const vnpay = new VNPay({
    tmnCode: 'PX2DIOF7',
    secureSecret: '19A2ZLVXKMDZ0YIJ2DDPYAY8LPB7I8FF',
    vnpayHost: 'https://sandbox.vnpayment.vn/',
    testMode: true, // tùy chọn
    hashAlgorithm: 'SHA512', // tùy chọn
    logger: fn => fn, // tùy chọn
  });
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
  const vnpayResponse = await vnpay.buildPaymentUrl({
    vnp_Amount: 50000, // Số tiền
    vnp_IpAddr: '127.0.0.1',
    vnp_TxnRef: '123456',
    vnp_OrderInfo: '123456',
    vnp_OrderType: 'ProductCode.Other',
    vnp_ReturnUrl: 'http://localhost:3000/api/check-payment-vnpay',
    vnp_Locale: VNPayLocale.VN, // 'vn' hoặc 'en'
    vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là hiện tại
    vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn
  });

  return res.status(201).json(vnpayResponse);
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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());  // Thêm parser cho JSON payloads
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


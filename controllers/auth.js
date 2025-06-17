const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    title: 'Đăng nhập',
    path: '/login'
  });
};

exports.postLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    
    const user = await User.findByEmail(email);
    
    if (!user) {
      // Không tìm thấy người dùng
      return res.render('auth/login', {
        title: 'Đăng nhập',
        path: '/login',
        errorMessage: 'Email hoặc mật khẩu không đúng'
      });
    }
    
    const doMatch = await bcrypt.compare(password, user.password);
    
    if (doMatch) {
      // Mật khẩu đúng
      req.session.isLoggedIn = true;
      req.session.user = user;
      return req.session.save(err => {
        if (err) {
          console.log(err);
        }
        // Chuyển hướng dựa trên vai trò
        if (user.role === 'admin') {
          res.redirect('/admin/dashboard');
        } else {
          res.redirect('/user');
        }
      });
    } else {
      // Mật khẩu sai
      return res.render('auth/login', {
        title: 'Đăng nhập',
        path: '/login',
        errorMessage: 'Email hoặc mật khẩu không đúng'
      });
    }
  } catch (err) {
    console.log(err);
    res.redirect('/login');
  }
};

exports.getRegister = (req, res, next) => {
  res.render('auth/register', {
    title: 'Đăng ký',
    path: '/register'
  });
};

exports.postRegister = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    
    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Đăng ký',
        path: '/register',
        errorMessage: 'Email đã tồn tại trong hệ thống'
      });
    }
    
    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Đăng ký',
        path: '/register',
        errorMessage: 'Mật khẩu xác nhận không khớp'
      });
    }
    
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Tạo người dùng mới (mặc định là vai trò 'user')
    const user = new User(email, hashedPassword);
    await user.save();
    
    res.redirect('/login');
  } catch (err) {
    console.log(err);
    res.redirect('/register');
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
};

// Quên mật khẩu
exports.getForgotPassword = (req, res, next) => {
  res.render('auth/forgot-password', {
    title: 'Quên mật khẩu',
    path: '/forgot-password'
  });
};

exports.postForgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email;
    
    // Kiểm tra xem email có tồn tại trong hệ thống không
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.render('auth/forgot-password', {
        title: 'Quên mật khẩu',
        path: '/forgot-password',
        errorMessage: 'Không tìm thấy tài khoản với email này'
      });
    }
    
    // Trong môi trường thực tế, tại đây sẽ tạo token và gửi email
    // Nhưng trong demo này, chúng ta sẽ chỉ hiển thị thông báo thành công
    
    res.render('auth/forgot-password', {
      title: 'Quên mật khẩu',
      path: '/forgot-password',
      successMessage: 'Đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn'
    });
  } catch (err) {
    console.log(err);
    res.redirect('/forgot-password');
  }
}; 
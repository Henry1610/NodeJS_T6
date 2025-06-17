module.exports = {
  // Kiểm tra người dùng đã đăng nhập chưa
  isAuth: (req, res, next) => {
    if (!req.session.isLoggedIn) {
      return res.redirect('/login');
    }
    next();
  },

  // Kiểm tra người dùng có quyền admin không
  isAdmin: (req, res, next) => {
    if (!req.session.isLoggedIn) {
      return res.redirect('/login');
    }
    if (req.session.user.role !== 'admin') {
      return res.redirect('/403'); // Trang lỗi không có quyền
    }
    next();
  },

  // Hỗ trợ kiểm tra vai trò
  hasRole: (roles) => {
    return (req, res, next) => {
      if (!req.session.isLoggedIn) {
        return res.redirect('/login');
      }
      if (!roles.includes(req.session.user.role)) {
        return res.redirect('/403');
      }
      next();
    };
  },

  // Đảm bảo người dùng chưa đăng nhập (dùng cho trang login, register)
  isNotAuth: (req, res, next) => {
    if (req.session.isLoggedIn) {
      // Kiểm tra vai trò để chuyển hướng đúng
      if (req.session.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/user');
      }
    }
    next();
  }
};
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
    if (!req.session.isLoggedIn || req.session.user.role !== 'admin') {
      return res.status(403).render('pages/403', {
        title: 'Không có quyền truy cập',
        path: req.originalUrl
      });
    }
    next();
  },

  // Đảm bảo người dùng đã đăng xuất (dùng cho trang login/register)
  isNotAuth: (req, res, next) => {
    if (req.session.isLoggedIn) {
      // Nếu là admin, chuyển về trang admin
      if (req.session.user.role === 'admin') {
        return res.redirect('/admin/product-statistics');
      }
      // Nếu là user thường, chuyển về trang chính
      return res.redirect('/');
    }
    next();
  }
}; 
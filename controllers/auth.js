const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.getLogin = (req, res, next) => {
  res.render('pages/auth/login', {
    title: 'Đăng nhập',
    path: '/login',
    errorMessage: null
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  
  User.findByEmail(email)
    .then(user => {
      if (!user) {
        return res.render('pages/auth/login', {
          title: 'Đăng nhập',
          path: '/login',
          errorMessage: 'Email hoặc mật khẩu không đúng!'
        });
      }
      
      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              if (user.role === 'admin') {
                res.redirect('/admin/product-statistics');
              } else {
                res.redirect('/');
              }
            });
          }
          
          res.render('pages/auth/login', {
            title: 'Đăng nhập',
            path: '/login',
            errorMessage: 'Email hoặc mật khẩu không đúng!'
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => {
      console.log(err);
      res.redirect('/login');
    });
};

exports.getRegister = (req, res, next) => {
  res.render('pages/auth/register', {
    title: 'Đăng ký',
    path: '/register',
    errorMessage: null
  });
};

exports.postRegister = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  
  if (password !== confirmPassword) {
    return res.render('pages/auth/register', {
      title: 'Đăng ký',
      path: '/register',
      errorMessage: 'Mật khẩu không trùng khớp!'
    });
  }
  
  User.findByEmail(email)
    .then(userDoc => {
      if (userDoc) {
        return res.render('pages/auth/register', {
          title: 'Đăng ký',
          path: '/register',
          errorMessage: 'Email đã tồn tại, vui lòng chọn email khác!'
        });
      }
      
      return bcrypt.hash(password, 12)
        .then(hashedPassword => {
          const user = new User(email, hashedPassword, 'user');
          return user.save();
        })
        .then(result => {
          res.redirect('/login');
        });
    })
    .catch(err => {
      console.log(err);
      res.redirect('/register');
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
}; 
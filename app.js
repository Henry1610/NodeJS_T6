const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/User');
const ejsMate = require('ejs-mate');

const app = express();

//Khai báo engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', 'views')

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const { log } = require('console');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình session
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false
  })
);

// Middleware để lưu đường dẫn hiện tại
app.use((req, res, next) => {
  res.locals.path = req.originalUrl;
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.isAdmin = req.session.user && req.session.user.role === 'admin';
  res.locals.user = req.session.user || null;
  next();
});

// Lấy thông tin người dùng từ session
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      console.log(err);
      next();
    });
});

// Route mặc định cho đường dẫn /
app.get('/', (req, res) => {
  if (req.session.isLoggedIn && req.session.user.role === 'admin') {
    return res.redirect('/admin/product-statistics');
  }
  res.redirect('/user');
});

app.use('/admin', adminRoutes.router);
app.use('/user', userRoutes);
app.use(shopRoutes);
app.use(authRoutes);

mongoConnect()
    .then(() => {
        app.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    })
    .catch(err => {
        console.error('Failed to start server:', err);
    });

app.use((req, res, next) => {
    res.status(404).render('pages/404', { title: 'Lỗi' });
});


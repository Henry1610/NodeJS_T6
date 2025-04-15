const Product = require('../models/product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Cart = require('../models/Cart');

// Trang chủ cho người dùng
exports.getHomePage = async (req, res, next) => {
  try {
    // Lấy 8 sản phẩm mới nhất
    const newestProducts = await Product.fetchAll(8);
    
    res.render('user/pages/home', {
      title: 'Trang chủ',
      path: '/',
      newestProducts: newestProducts
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Trang hiển thị tất cả sản phẩm
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.fetchAll();
    
    res.render('user/pages/products', {
      title: 'Danh sách sản phẩm',
      path: '/user/products',
      products: products
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Trang chi tiết sản phẩm
exports.getProductDetail = async (req, res, next) => {
  try {
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);
    
    if (!product) {
      return res.status(404).render('pages/404', {
        title: 'Không tìm thấy sản phẩm',
        path: req.originalUrl
      });
    }
    
    // Lấy các sản phẩm liên quan (cùng danh mục)
    const relatedProducts = await Product.findByCategory(product.category, 4);
    
    // Lấy thông tin danh mục và thương hiệu
    const db = require('../util/database').getDb();
    const category = await db.collection('categories').findOne({ _id: product.category });
    const brand = await db.collection('brands').findOne({ _id: product.brand });
    
    // Thêm thông tin danh mục và thương hiệu vào sản phẩm
    product.categoryName = category ? category.name : 'Unknown Category';
    product.brandName = brand ? brand.name : 'Unknown Brand';
    
    res.render('user/pages/product-detail', {
      title: product.title,
      path: '/user/products',
      product: product,
      relatedProducts: relatedProducts.filter(p => p._id.toString() !== prodId)
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Trang sản phẩm theo danh mục
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const products = await Product.findByCategory(categoryId);
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).render('pages/404', {
        title: 'Không tìm thấy danh mục',
        path: req.originalUrl
      });
    }
    
    res.render('user/pages/category', {
      title: category.name,
      path: `/user/category/${categoryId}`,
      products: products,
      category: category
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Trang hồ sơ người dùng
exports.getProfile = (req, res, next) => {
  res.render('user/pages/profile', {
    title: 'Hồ sơ của tôi',
    path: '/user/profile'
  });
};

// Trang đơn hàng
exports.getOrders = (req, res, next) => {
  res.render('user/pages/orders', {
    title: 'Đơn hàng của tôi',
    path: '/user/orders',
    orders: [] // Sẽ thay thế bằng dữ liệu thực tế
  });
};

// Trang thông tin khác
exports.getAboutPage = (req, res, next) => {
  res.render('user/pages/about', {
    title: 'Giới thiệu',
    path: '/user/about'
  });
};

exports.getContactPage = (req, res, next) => {
  res.render('user/pages/contact', {
    title: 'Liên hệ',
    path: '/user/contact'
  });
};

exports.getFaqPage = (req, res, next) => {
  res.render('user/pages/faq', {
    title: 'Câu hỏi thường gặp',
    path: '/user/faq'
  });
};

exports.getShippingInfo = (req, res, next) => {
  res.render('user/pages/shipping', {
    title: 'Thông tin vận chuyển',
    path: '/user/shipping'
  });
};

// Tìm kiếm sản phẩm
exports.searchProducts = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    let products = [];
    
    if (query) {
      products = await Product.search(query);
    }
    
    res.render('user/pages/search-results', {
      title: `Kết quả tìm kiếm: ${query}`,
      path: '/user/search',
      query: query,
      products: products
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Giỏ hàng
exports.getCart = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) {
      return res.redirect('/login');
    }

    const userId = req.session.user._id;
    const cart = await Cart.getCart(userId);
    const cartItems = await cart.getDetailCart();

    res.render('user/pages/cart', {
      title: 'Giỏ hàng',
      path: '/user/cart',
      cartItems: cartItems
    });
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng:', error);
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) {
      return res.redirect('/login');
    }

    const productId = req.body.productId;
    const quantity = parseInt(req.body.quantity) || 1;
    const userId = req.session.user._id;

    // Lấy giỏ hàng hiện tại
    const cart = await Cart.getCart(userId);
    
    // Thêm sản phẩm vào giỏ hàng
    await cart.addToCart(productId, quantity);

    // Chuyển hướng về trang sản phẩm hoặc giỏ hàng
    const referer = req.get('referer');
    if (referer && referer.includes('product')) {
      return res.redirect(referer);
    }
    res.redirect('/user/cart');
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error);
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) {
      return res.redirect('/login');
    }

    const productId = req.body.productId;
    const userId = req.session.user._id;

    // Lấy giỏ hàng hiện tại
    const cart = await Cart.getCart(userId);
    
    // Xóa sản phẩm khỏi giỏ hàng
    await cart.removeFromCart(productId);

    res.redirect('/user/cart');
  } catch (error) {
    console.error('Lỗi khi xóa khỏi giỏ hàng:', error);
    next(error);
  }
};

// API cập nhật số lượng sản phẩm trong giỏ hàng
exports.updateCartQuantity = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const productId = req.body.productId;
    const quantity = parseInt(req.body.quantity);
    const userId = req.session.user._id;

    if (!productId || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Lấy giỏ hàng hiện tại
    const cart = await Cart.getCart(userId);
    
    // Cập nhật số lượng sản phẩm
    await cart.updateQuantity(productId, quantity);

    // Lấy giỏ hàng đã cập nhật
    const updatedCart = await cart.getDetailCart();

    // Tính toán tổng tiền
    let totalPrice = 0;
    updatedCart.forEach(item => {
      totalPrice += item.product.price * item.quantity;
    });

    // Tính phí vận chuyển
    const shippingFee = totalPrice >= 500000 ? 0 : 30000;
    const finalTotal = totalPrice + shippingFee;

    res.json({
      success: true,
      cartItems: updatedCart,
      totalPrice: totalPrice,
      shippingFee: shippingFee,
      finalTotal: finalTotal
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật số lượng sản phẩm:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 
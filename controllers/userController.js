const Product = require('../models/product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const mongodb = require('mongodb');
const User = require('../models/User');

// Trang chủ cho người dùng
exports.getHomePage = async (req, res, next) => {
  try {
    // Lấy 8 sản phẩm mới nhất
    const newestProducts = await Product.fetchAll(8);
    
    res.render('user/home', {
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
    // Lấy dữ liệu từ MongoDB
    const products = await Product.fetchAll();
    const categories = await Category.fetchAll();
    const brands = await Brand.fetchAll();
    
    // Thêm thông tin tên danh mục và thương hiệu vào mỗi sản phẩm
    for (let product of products) {
      const category = categories.find(cat => cat._id.toString() === product.category.toString());
      const brand = brands.find(b => b._id.toString() === product.brand.toString());
      
      product.categoryName = category ? category.name : 'Unknown Category';
      product.brandName = brand ? brand.name : 'Unknown Brand';
    }
    
    res.render('user/pages/products', {
      title: 'Danh sách sản phẩm',
      path: '/user/products',
      products: products,
      categories: categories,
      brands: brands
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
  if (!req.session.isLoggedIn) {
    return res.render('auth/login', {
      title: 'Đăng nhập',
      path: '/login',
      errorMessage: 'Vui lòng đăng nhập để xem hồ sơ của bạn'
    });
  }
  
  res.render('user/pages/profile', {
    title: 'Hồ sơ của tôi',
    path: '/user/profile'
  });
};

// Trang đơn hàng
exports.getOrders = async (req, res, next) => {
  try {
    // Không kiểm tra đăng nhập
    const userId = req.session.user ? req.session.user._id : null;
    
    if (!userId) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        path: '/login',
        errorMessage: 'Vui lòng đăng nhập để xem đơn hàng của bạn'
      });
    }

    // Lấy danh sách đơn hàng của người dùng
    const orders = await Order.getOrdersByUser(userId);

    res.render('user/pages/orders', {
      title: 'Đơn hàng của tôi',
      path: '/user/orders',
      orders: orders,
      query: req.query
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    next(error);
  }
};

// Xem chi tiết đơn hàng
exports.getOrderDetail = async (req, res, next) => {
  try {
    // Không kiểm tra đăng nhập
    const userId = req.session.user ? req.session.user._id : null;
    
    if (!userId) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        path: '/login',
        errorMessage: 'Vui lòng đăng nhập để xem chi tiết đơn hàng'
      });
    }

    const orderId = req.params.orderId;
    const order = await Order.getOrderById(orderId);

    if (!order || order.user._id.toString() !== userId.toString()) {
      return res.status(404).render('pages/404', {
        title: 'Không tìm thấy đơn hàng',
        path: req.originalUrl
      });
    }

    res.render('user/pages/order-detail', {
      title: `Đơn hàng #${order._id}`,
      path: '/user/orders',
      order: order,
      query: req.query
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
    next(error);
  }
};

// Hủy đơn hàng
exports.cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.user ? req.session.user._id : null;
    
    if (!userId) {
      return res.redirect('/login');
    }
    
    const order = await Order.getOrderById(orderId);
    
    if (!order || order.user._id.toString() !== userId.toString()) {
      return res.status(404).render('pages/404', {
        title: 'Không tìm thấy đơn hàng',
        path: req.originalUrl
      });
    }
    
    if (order.status !== 'Chờ xác nhận') {
      return res.redirect(`/user/order/${orderId}?error=Không+thể+hủy+đơn+hàng+này+vì+đã+được+xử+lý`);
    }
    
    await Order.cancelOrder(orderId);
    
    // Khôi phục số lượng sản phẩm
    const db = require('../util/database').getDb();
    for (const item of order.items) {
      await db.collection('products').updateOne(
        { _id: new mongodb.ObjectId(item.productId) },
        { $inc: { quantity: item.quantity } }
      );
    }
    
    res.redirect('/user/orders?success=Đơn+hàng+đã+được+hủy+thành+công');
  } catch (error) {
    console.error('Lỗi khi hủy đơn hàng:', error);
    res.redirect('/user/orders?error=Đã+xảy+ra+lỗi+khi+hủy+đơn+hàng');
  }
};

// Thêm handler cho trang thành công sau khi đặt hàng
exports.getOrderSuccess = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.user ? req.session.user._id : null;
    
    if (!userId) {
      return res.redirect('/login');
    }
    
    // Kiểm tra xem đơn hàng có tồn tại và thuộc về người dùng hiện tại không
    const order = await Order.getOrderById(orderId);
    
    if (!order || order.user._id.toString() !== userId.toString()) {
      return res.redirect('/user/orders');
    }
    
    res.render('user/pages/order-success', {
      title: 'Đặt hàng thành công',
      path: '/user/checkout/success',
      orderId: orderId
    });
  } catch (error) {
    console.error('Lỗi khi hiển thị trang đặt hàng thành công:', error);
    res.redirect('/user/orders');
  }
};

// Sửa phương thức checkout để trả về link đến trang thành công thay vì chỉ trả về JSON
exports.checkout = async (req, res, next) => {
  try {
    // Không kiểm tra đăng nhập
    const userId = req.session.user ? req.session.user._id : null;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Vui lòng đăng nhập để thanh toán' 
      });
    }

    // Lấy giỏ hàng hiện tại
    const cart = await Cart.getCart(userId);
    const cartItems = await cart.getDetailCart();

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Giỏ hàng trống, không thể thanh toán' 
      });
    }

    // Lấy thông tin từ request body (đã được tính toán từ frontend)
    const { fullName, phone, address, note, paymentMethod, discountCode, discountValue, amount } = req.body;
    
    console.log('Checkout data from frontend:', { 
      fullName, phone, address, note, paymentMethod, 
      discountCode, discountValue, amount 
    });

    // Tính tổng tiền gốc (để lưu vào DB)
    let totalPrice = 0;
    cartItems.forEach(item => {
      totalPrice += item.product.price * item.quantity;
    });

    // Tính phí vận chuyển
    const shippingFee = totalPrice >= 500000 ? 0 : 30000;

    // Sử dụng amount từ frontend (đã trừ discount) làm tổng thanh toán
    const finalAmount = parseInt(amount) || (totalPrice + shippingFee);
    const appliedDiscountValue = parseInt(discountValue) || 0;
    const appliedDiscountCode = discountCode || '';

    console.log('Price calculation:', {
      totalPrice,
      shippingFee,
      appliedDiscountValue,
      finalAmount
    });

    // Lấy thông tin người dùng
    const user = {
      _id: new mongodb.ObjectId(userId),
      email: req.session.user.email,
      role: req.session.user.role
    };

    // Kiểm tra số lượng tồn kho của từng sản phẩm
    const db = require('../util/database').getDb();
    for (const item of cartItems) {
      const product = await db.collection('products').findOne({ _id: item.product._id });
      
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          message: `Sản phẩm ${item.product.title} không còn tồn tại` 
        });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Sản phẩm ${product.title} chỉ còn ${product.quantity} sản phẩm trong kho` 
        });
      }
    }

    // Chuyển đổi thông tin sản phẩm từ giỏ hàng
    const orderItems = cartItems.map(item => {
      return {
        productId: item.product._id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl,
        subtotal: item.product.price * item.quantity,
        categoryName: item.product.categoryName,
        brandName: item.product.brandName
      };
    });

    // Tạo đơn hàng mới với thông tin đầy đủ
    const order = new Order(
      orderItems,
      user,
      totalPrice, // Tổng tiền gốc
      shippingFee,
      {
        fullName: fullName,
        phone: phone,
        address: address,
        note: note,
        paymentMethod: paymentMethod,
        discountCode: appliedDiscountCode,
        discountValue: appliedDiscountValue,
        finalAmount: finalAmount // Tổng tiền sau khi trừ discount
      }
    );

    // Lưu đơn hàng vào database
    const result = await order.save();
    
    if (!result || !result.insertedId) {
      throw new Error('Không thể lưu đơn hàng vào cơ sở dữ liệu');
    }

    // Cập nhật số lượng sản phẩm trong kho
    try {
      for (const item of orderItems) {
        // Lấy thông tin sản phẩm từ database
        const product = await db.collection('products').findOne({ 
          _id: new mongodb.ObjectId(item.productId) 
        });
        
        if (!product) {
          console.error(`Không tìm thấy sản phẩm với ID: ${item.productId}`);
          continue;
        }
        
        // Chuyển đổi quantity sang số
        const quantity = parseInt(item.quantity) || 0;
        const currentQuantity = parseInt(product.quantity) || 0;
        
        // Cập nhật số lượng sản phẩm
        await db.collection('products').updateOne(
          { _id: new mongodb.ObjectId(item.productId) },
          { 
            $set: { 
              quantity: Math.max(0, currentQuantity - quantity) 
            } 
          }
        );
      }
    } catch (updateError) {
      console.error('Lỗi khi cập nhật số lượng sản phẩm:', updateError);
      // Không rollback đơn hàng vì đã tạo thành công
    }

    // Xóa giỏ hàng sau khi đặt hàng thành công
    try {
      await cart.clearCart();
    } catch (clearCartError) {
      console.error('Lỗi khi xóa giỏ hàng:', clearCartError);
      // Không ảnh hưởng đến đặt hàng thành công
    }

    // Trả về kết quả với đường dẫn đến trang thành công
    console.log('Checkout result:', result);
    console.log('Inserted ID:', result.insertedId);
    
    return res.status(200).json({
      success: true,
      message: 'Đặt hàng thành công',
      orderId: result.insertedId,
      redirectUrl: `/user/checkout/success/${result.insertedId}`
    });
  } catch (error) {
    console.error('Lỗi chi tiết khi thanh toán:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi thanh toán: ' + (error.message || 'Lỗi không xác định')
    });
  }
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
      return res.render('auth/login', {
        title: 'Đăng nhập',
        path: '/login',
        errorMessage: 'Vui lòng đăng nhập để xem giỏ hàng của bạn'
      });
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

// Trang checkout
exports.getCheckoutPage = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) {
      return res.render('auth/login', {
        title: 'Đăng nhập',
        path: '/login',
        errorMessage: 'Vui lòng đăng nhập để thanh toán'
      });
    }

    const userId = req.session.user._id;
    const cart = await Cart.getCart(userId);
    const cartItems = await cart.getDetailCart();

    if (!cartItems || cartItems.length === 0) {
      req.session.flash = {
        type: 'error',
        message: 'Giỏ hàng trống, không thể thanh toán'
      };
      return res.redirect('/user/cart');
    }

    // Tính tổng tiền
    let totalPrice = 0;
    cartItems.forEach(item => {
      totalPrice += item.product.price * item.quantity;
    });

    // Tính phí vận chuyển
    const shippingFee = totalPrice >= 500000 ? 0 : 30000;
    const finalTotal = totalPrice + shippingFee;

    res.render('user/pages/checkout', {
      title: 'Thanh toán',
      path: '/user/checkout',
      cartItems: cartItems,
      totalPrice: totalPrice,
      shippingFee: shippingFee,
      finalTotal: finalTotal,
      user: req.session.user
    });
  } catch (error) {
    console.error('Lỗi khi hiển thị trang checkout:', error);
    next(error);
  }
};

exports.addToCart = async (req, res) => {
  try {
    if (!req.session.isLoggedIn) {
      req.session.flash = {
        type: 'error',
        message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng'
      };
      return res.redirect('/login');
    }

    const productId = req.body.productId;
    const quantity = parseInt(req.body.quantity) || 1;
    
    // Lấy thông tin sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      req.session.flash = {
        type: 'error',
        message: 'Sản phẩm không tồn tại'
      };
      return res.redirect('/user/products');
    }
    
    // Kiểm tra số lượng sản phẩm
    if (product.quantity < quantity) {
      req.session.flash = {
        type: 'error',
        message: `Sản phẩm chỉ còn ${product.quantity} sản phẩm trong kho`
      };
      return res.redirect(`/user/product/${productId}`);
    }

    const userId = req.session.user._id;
    const cart = await Cart.getCart(userId);
    
    // Thêm sản phẩm vào giỏ hàng
    await cart.addToCart(productId, quantity);
    
    req.session.flash = {
      type: 'success',
      message: 'Đã thêm sản phẩm vào giỏ hàng'
    };
    return res.redirect('/user/cart');
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error);
    req.session.flash = {
      type: 'error',
      message: 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng'
    };
    return res.redirect('/user/products');
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
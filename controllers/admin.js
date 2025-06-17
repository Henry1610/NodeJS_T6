const Product = require('../models/product');
const Brand = require('../models/brand');
const Category = require('../models/category');
const lodashUtils = require('../util/lodash-utils');


exports.getAddProduct = (req, res, next) => {
    Promise.all([
        Category.fetchAll(),
        Brand.fetchAll()
    ])
    .then(([categories, brands]) => {
        res.render('admin/product/addproduct', { 
            title: 'Add Product',
            categories,
            brands,
            editing: false
        });
    })
    .catch(err => {
        console.error(err);
        res.render('admin/product/addproduct', { 
            title: 'Add Product',
            categories: [],
            brands: [],
            editing: false
        });
    });
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const category = req.body.category;
    const brand = req.body.brand;
    const description = req.body.description;
    const quantity = req.body.quantity;

    const image = req.file; // lấy file từ multer

    // Kiểm tra dữ liệu đầu vào
    const errors = [];
    
    if (!title || title.trim().length === 0) {
        errors.push("Vui lòng nhập tên sản phẩm");
    }
    
    if (!price || isNaN(price) || price <= 0) {
        errors.push("Vui lòng nhập giá hợp lệ");
    }
    
    if (!category) {
        errors.push("Vui lòng chọn danh mục");
    }
    
    if (!brand) {
        errors.push("Vui lòng chọn thương hiệu");
    }
    
    if (!quantity || isNaN(quantity) || quantity < 0) {
        errors.push("Vui lòng nhập số lượng hợp lệ");
    }
    
    if (!image) {
        errors.push("Vui lòng tải lên hình ảnh sản phẩm");
    }
    
    if (errors.length > 0) {
        console.log("Lỗi khi thêm sản phẩm:", errors);
        
        return Promise.all([
            Category.fetchAll(),
            Brand.fetchAll()
        ])
        .then(([categories, brands]) => {
            return res.status(422).render('admin/product/addproduct', {
                title: 'Add Product',
                errorMessage: errors.join(", "),
                categories,
                brands,
                oldInput: {
                    title,
                    price,
                    category,
                    brand,
                    description,
                    quantity
                }
            });
        })
        .catch(err => {
            console.error(err);
            res.redirect('/admin/addproduct?error=Đã xảy ra lỗi khi xử lý biểu mẫu');
        });
    }

    const imgUrl = '/images/' + image.filename;

    const product = new Product(null, title, imgUrl, description, price, category, brand, quantity);
    
    product.save()
        .then(result => {
            console.log('Thêm sản phẩm thành công:', title);
            res.redirect('/admin/productlist');
        })
        .catch(err => {
            console.error("Lỗi khi lưu sản phẩm:", err);
            return Promise.all([
                Category.fetchAll(),
                Brand.fetchAll()
            ])
            .then(([categories, brands]) => {
                res.status(500).render('admin/product/addproduct', {
                    title: 'Add Product',
                    errorMessage: 'Đã xảy ra lỗi khi thêm sản phẩm: ' + err.message,
                    categories,
                    brands,
                    oldInput: {
                        title,
                        price,
                        category,
                        brand,
                        description,
                        quantity
                    }
                });
            })
            .catch(fetchErr => {
                console.error(fetchErr);
                res.redirect('/admin/addproduct?error=Đã xảy ra lỗi khi thêm sản phẩm');
            });
        });
};


exports.getProducts = (req, res, next) => {
    Product.fetchAll()
        .then(products => {
            res.render('admin-products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'
            });
        })
        .catch(err => {
            console.log(err);
            res.redirect('/');
        });
};

exports.getEditProduct = (req, res, next) => {
    const prodId = req.params.productId;
    
    Promise.all([
        Product.findById(prodId),
        Category.fetchAll(),
        Brand.fetchAll()
    ])
    .then(([product, categories, brands]) => {
        if (!product) {
            return res.redirect('/admin/productlist');
        }
        
        // Tìm tên danh mục và thương hiệu
        const category = categories.find(cat => cat._id.toString() === product.category.toString());
        const brand = brands.find(b => b._id.toString() === product.brand.toString());
        
        // Thêm tên danh mục và thương hiệu vào sản phẩm
        product.categoryName = category ? category.name : 'N/A';
        product.brandName = brand ? brand.name : 'N/A';
        
        res.render('admin/product/editproduct', {
            title: 'Edit Product',
            product: product,
            categories: categories,
            brands: brands
        });
    })
    .catch(err => {
        console.log(err);
        res.redirect('/admin/productlist');
    });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedCategory = req.body.category;
    const updatedBrand = req.body.brand;
    const updatedDesc = req.body.description;
    const updatedQuantity = req.body.quantity;
    
    // Xử lý ảnh mới nếu có
    let updatedImgUrl = req.body.imgUrl;
    if (req.file) {
        updatedImgUrl = '/images/' + req.file.filename;
    }

    const updatedProduct = new Product(
        prodId,
        updatedTitle,
        updatedImgUrl,
        updatedDesc,
        updatedPrice,
        updatedCategory,
        updatedBrand,
        updatedQuantity
    );
    updatedProduct.save()
        .then(result => {
            console.log('UPDATED PRODUCT!');
            res.redirect('/admin/productlist');
        })
        .catch(err => {
            console.log(err);
            res.redirect('/admin/productlist');
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.deleteById(prodId)
        .then(() => {
            console.log('PRODUCT DELETED!');
            res.redirect('/admin/productlist');
        })
        .catch(err => {
            console.log(err);
            res.redirect('/admin/productlist');
        });
};

exports.getProductList = (req, res, next) => {
    Product.fetchAll()
        .then(products => {
            res.render('admin/product/productlist', {
                title: 'Product List',
                products: products
            });
        })
        .catch(err => {
            console.log(err);
            res.render('admin/product/productlist', {
                title: 'Product List',
                products: []
            });
        });
};

exports.getProductDetail = (req, res, next) => {
    const productId = req.params.productId;
    
    Promise.all([
        Product.findById(productId),
        Category.fetchAll(),
        Brand.fetchAll()
    ])
    .then(([product, categories, brands]) => {
        if (!product) {
            return res.redirect('/admin/productlist');
        }
        
        // Tìm tên danh mục và thương hiệu
        const category = categories.find(cat => cat._id.toString() === product.category.toString());
        const brand = brands.find(b => b._id.toString() === product.brand.toString());
        
        // Thêm tên danh mục và thương hiệu vào sản phẩm
        product.categoryName = category ? category.name : 'N/A';
        product.brandName = brand ? brand.name : 'N/A';
        
        res.render('admin/product/productdetail', {
            title: 'Product Detail',
            product: product
        });
    })
    .catch(err => {
        console.log(err);
        res.redirect('/admin/productlist');
    });
};

exports.getProductStatistics = (req, res, next) => {
  Product.fetchAll()
    .then(products => {
      // Nhóm sản phẩm theo danh mục
      const productsByCategory = lodashUtils.groupProductsByField(products, 'categoryName');
      
      // Tính tổng giá trị kho theo danh mục
      const valueByCategory = lodashUtils.calculateValueByCategory(productsByCategory);
      
      // Lấy top 5 sản phẩm đắt nhất
      const topExpensiveProducts = lodashUtils.getTopProducts(products, 'price', 'desc', 5);
      
      // Lấy top 5 sản phẩm có số lượng nhiều nhất
      const topQuantityProducts = lodashUtils.getTopProducts(products, 'quantity', 'desc', 5);
      
      // Lấy sản phẩm có số lượng thấp (cần nhập thêm)
      const lowStockProducts = lodashUtils.getLowStockProducts(products, 10);
      
      // Tính tổng giá trị kho
      const totalInventoryValue = lodashUtils.calculateTotalInventoryValue(products);
      
      // Nhóm sản phẩm theo thương hiệu
      const productsByBrand = lodashUtils.groupProductsByField(products, 'brandName');
      
      // Thống kê số lượng sản phẩm theo danh mục
      const productCountByCategory = lodashUtils.countByField(products, 'categoryName');
      
      // Thống kê số lượng sản phẩm theo thương hiệu
      const productCountByBrand = lodashUtils.countByField(products, 'brandName');
      
      res.render('admin/product/statistics', {
        title: 'Thống kê sản phẩm',
        products,
        productsByCategory,
        valueByCategory,
        topExpensiveProducts,
        topQuantityProducts,
        lowStockProducts,
        totalInventoryValue,
        productsByBrand,
        productCountByCategory,
        productCountByBrand,
        totalProducts: products.length
      });
    })
    .catch(err => {
      console.log(err);
      res.redirect('/admin/productlist');
    });
};

exports.searchProducts = (req, res, next) => {
  const keyword = req.query.keyword || '';
  
  if (!keyword) {
    return res.redirect('/admin/productlist');
  }
  
  Product.fetchAll()
    .then(products => {
      // Tìm kiếm sản phẩm
      const searchResults = lodashUtils.searchProducts(products, keyword, ['title', 'description', 'categoryName', 'brandName']);
      
      res.render('admin/product/search-results', {
        title: 'Kết quả tìm kiếm',
        products: searchResults,
        keyword: keyword,
        totalResults: searchResults.length
      });
    })
    .catch(err => {
      console.log(err);
      res.redirect('/admin/productlist');
    });
};
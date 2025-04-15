const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
        .then(products => {
            res.render('shop', { 
                prods: products, 
                pageTitle: 'Shop ABC', 
                path: '/products' 
            });
        })
        .catch(err => {
            console.log(err);
            res.redirect('/');
        });
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId).then(product => {
        res.render('shop-product-detail', {
            product: product,
            pageTitle: product.title,
            path: '/products'
        });
    })
    .catch(error=>console.log(error)) 
   
    
};

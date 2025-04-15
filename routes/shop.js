const path = require('path');

const express = require('express');

const rootDir = require('../util/path');

const products = require('./admin').products;

const shopController = require('../controllers/shop');

const router = express.Router();

router.get('/', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

module.exports = router;

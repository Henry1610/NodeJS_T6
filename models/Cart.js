const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const getDb = require('../util/database').getDb;
const Product = require('./product');

class Cart {
    constructor(items, userId) {
        this.items = items || [];
        this.userId = userId;
    }

    // Thêm sản phẩm vào giỏ hàng
    async addToCart(productId, quantity = 1) {
        try {
            // Kiểm tra xem sản phẩm có tồn tại không
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Sản phẩm không tồn tại');
            }

            // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
            const existingProductIndex = this.items.findIndex(
                item => item.productId.toString() === productId.toString()
            );

            // Nếu sản phẩm đã có trong giỏ hàng, tăng số lượng
            if (existingProductIndex !== -1) {
                this.items[existingProductIndex].quantity += quantity;
                
                // Kiểm tra nếu số lượng vượt quá số lượng sản phẩm có sẵn
                if (this.items[existingProductIndex].quantity > product.quantity) {
                    this.items[existingProductIndex].quantity = product.quantity;
                }
            } else {
                // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
                this.items.push({
                    productId: new ObjectId(productId),
                    quantity: quantity > product.quantity ? product.quantity : quantity
                });
            }

            // Lưu giỏ hàng vào database
            const db = getDb();
            await db.collection('carts').updateOne(
                { userId: new ObjectId(this.userId) },
                { $set: { items: this.items } },
                { upsert: true }
            );

            return this.items;
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
            throw error;
        }
    }

    // Xóa sản phẩm khỏi giỏ hàng
    async removeFromCart(productId) {
        try {
            // Xóa sản phẩm khỏi giỏ hàng
            this.items = this.items.filter(
                item => item.productId.toString() !== productId.toString()
            );

            // Lưu giỏ hàng vào database
            const db = getDb();
            await db.collection('carts').updateOne(
                { userId: new ObjectId(this.userId) },
                { $set: { items: this.items } }
            );

            return this.items;
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
            throw error;
        }
    }

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    async updateQuantity(productId, quantity) {
        try {
            // Kiểm tra xem sản phẩm có tồn tại không
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Sản phẩm không tồn tại');
            }

            // Tìm sản phẩm trong giỏ hàng
            const existingProductIndex = this.items.findIndex(
                item => item.productId.toString() === productId.toString()
            );

            // Nếu sản phẩm có trong giỏ hàng, cập nhật số lượng
            if (existingProductIndex !== -1) {
                this.items[existingProductIndex].quantity = quantity;

                // Kiểm tra nếu số lượng vượt quá số lượng sản phẩm có sẵn
                if (this.items[existingProductIndex].quantity > product.quantity) {
                    this.items[existingProductIndex].quantity = product.quantity;
                }

                // Kiểm tra nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
                if (this.items[existingProductIndex].quantity <= 0) {
                    return this.removeFromCart(productId);
                }

                // Lưu giỏ hàng vào database
                const db = getDb();
                await db.collection('carts').updateOne(
                    { userId: new ObjectId(this.userId) },
                    { $set: { items: this.items } }
                );
            }

            return this.items;
        } catch (error) {
            console.error('Lỗi khi cập nhật số lượng sản phẩm trong giỏ hàng:', error);
            throw error;
        }
    }

    // Xóa tất cả sản phẩm trong giỏ hàng
    async clearCart() {
        try {
            this.items = [];
            
            // Lưu giỏ hàng vào database
            const db = getDb();
            await db.collection('carts').updateOne(
                { userId: new ObjectId(this.userId) },
                { $set: { items: this.items } }
            );

            return this.items;
        } catch (error) {
            console.error('Lỗi khi xóa tất cả sản phẩm trong giỏ hàng:', error);
            throw error;
        }
    }

    // Lấy giỏ hàng của người dùng
    static async getCart(userId) {
        try {
            const db = getDb();
            const cart = await db.collection('carts').findOne({ userId: new ObjectId(userId) });
            
            if (!cart) {
                return new Cart([], userId);
            }

            return new Cart(cart.items, userId);
        } catch (error) {
            console.error('Lỗi khi lấy giỏ hàng:', error);
            throw error;
        }
    }

    // Lấy chi tiết giỏ hàng với thông tin sản phẩm đầy đủ
    async getDetailCart() {
        try {
            if (!this.items.length) {
                return [];
            }

            // Lấy thông tin sản phẩm từ database
            const productIds = this.items.map(item => item.productId);
            const db = getDb();
            const products = await db.collection('products').find({ _id: { $in: productIds } }).toArray();
            
            // Lấy danh mục và thương hiệu
            const categories = await db.collection('categories').find().toArray();
            const brands = await db.collection('brands').find().toArray();
            
            // Map category và brand ID sang tên
            const productsWithNames = products.map(product => {
                const category = categories.find(
                    cat => cat._id.toString() === product.category.toString()
                );
                const brand = brands.find(
                    b => b._id.toString() === product.brand.toString()
                );
                
                return {
                    ...product,
                    categoryName: category ? category.name : 'Unknown Category',
                    brandName: brand ? brand.name : 'Unknown Brand'
                };
            });

            // Kết hợp thông tin sản phẩm với số lượng trong giỏ hàng
            const cartItems = this.items.map(item => {
                const product = productsWithNames.find(p => p._id.toString() === item.productId.toString());
                return {
                    product,
                    quantity: item.quantity
                };
            }).filter(item => item.product); // Lọc bỏ các sản phẩm không tồn tại

            return cartItems;
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết giỏ hàng:', error);
            throw error;
        }
    }
}

module.exports = Cart; 
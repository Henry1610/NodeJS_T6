const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const getDb = require('../util/database').getDb;

class Order {
    constructor(items, user, totalPrice, shippingFee, shippingInfo = null, status = 'Chờ xác nhận', id = null) {
        this.items = items; // Mảng các sản phẩm trong đơn hàng
        this.user = user; // Thông tin người dùng
        this.totalPrice = totalPrice; // Tổng giá trị đơn hàng gốc
        this.shippingFee = shippingFee; // Phí vận chuyển
        this.status = status; // Trạng thái đơn hàng
        this.orderDate = new Date(); // Ngày đặt hàng
        this._id = id ? new ObjectId(id) : null;
        
        // Thông tin giao hàng
        if (shippingInfo) {
            this.shippingInfo = {
                fullName: shippingInfo.fullName,
                phone: shippingInfo.phone,
                address: shippingInfo.address,
                note: shippingInfo.note || ''
            };
            
            // Thông tin thanh toán
            this.paymentInfo = {
                method: shippingInfo.paymentMethod || 'COD',
                discountCode: shippingInfo.discountCode || '',
                discountValue: shippingInfo.discountValue || 0,
                finalAmount: shippingInfo.finalAmount || (totalPrice + shippingFee)
            };
        }
    }

    // Lưu đơn hàng vào database
    async save() {
        const db = getDb();
        
        if (this._id) {
            // Cập nhật đơn hàng nếu đã tồn tại
            return db.collection('orders').updateOne(
                { _id: this._id },
                { $set: this }
            );
        } else {
            // Tạo đơn hàng mới
            return db.collection('orders').insertOne(this);
        }
    }

    // Lấy tất cả đơn hàng của một người dùng
    static async getOrdersByUser(userId) {
        const db = getDb();
        return db.collection('orders')
            .find({ 'user._id': new ObjectId(userId) })
            .sort({ orderDate: -1 }) // Sắp xếp theo ngày mới nhất
            .toArray();
    }

    // Lấy chi tiết đơn hàng theo ID
    static async getOrderById(orderId) {
        const db = getDb();
        return db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    }

    // Lấy tất cả đơn hàng (cho admin)
    static async getAllOrders() {
        const db = getDb();
        return db.collection('orders')
            .find()
            .sort({ orderDate: -1 })
            .toArray();
    }

    // Cập nhật trạng thái đơn hàng
    static async updateOrderStatus(orderId, status) {
        const db = getDb();
        return db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { status: status, updatedAt: new Date() } }
        );
    }

    // Hủy đơn hàng
    static async cancelOrder(orderId) {
        const db = getDb();
        return db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { 
                $set: { 
                    status: 'Đã hủy', 
                    cancelledAt: new Date() 
                } 
            }
        );
    }
}

module.exports = Order; 
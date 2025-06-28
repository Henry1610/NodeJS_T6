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

    // Tạo yêu cầu hủy đơn hàng
    static async createCancelRequest(orderId, userId, reason = '') {
        const db = getDb();
        const cancelRequest = {
            orderId: new ObjectId(orderId),
            userId: new ObjectId(userId),
            reason: reason,
            status: 'Chờ xử lý', // Chờ xử lý, Đã chấp nhận, Đã từ chối
            createdAt: new Date(),
            processedAt: null,
            processedBy: null
        };
        
        return db.collection('cancelRequests').insertOne(cancelRequest);
    }

    // Lấy yêu cầu hủy theo ID đơn hàng
    static async getCancelRequestByOrderId(orderId) {
        const db = getDb();
        return db.collection('cancelRequests').findOne({ 
            orderId: new ObjectId(orderId) 
        });
    }

    // Lấy yêu cầu hủy theo ID
    static async getCancelRequestById(requestId) {
        const db = getDb();
        return db.collection('cancelRequests').findOne({ 
            _id: new ObjectId(requestId) 
        });
    }

    // Lưu thông tin hoàn tiền
    static async saveRefundInfo(orderId, refundInfo) {
        const db = getDb();
        return db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { 
                $set: { 
                    refundInfo: refundInfo,
                    updatedAt: new Date()
                } 
            }
        );
    }

    // Cập nhật trạng thái hoàn tiền
    static async updateRefundStatus(refundTxnRef, status, additionalInfo = {}) {
        const db = getDb();
        return db.collection('orders').updateOne(
            { 'refundInfo.refundTxnRef': refundTxnRef },
            { 
                $set: { 
                    'refundInfo.refundStatus': status,
                    'refundInfo.updatedAt': new Date(),
                    ...additionalInfo
                } 
            }
        );
    }

    // Lấy tất cả yêu cầu hủy (cho admin)
    static async getAllCancelRequests() {
        const db = getDb();
        return db.collection('cancelRequests')
            .aggregate([
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'orderId',
                        foreignField: '_id',
                        as: 'order'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$order'
                },
                {
                    $unwind: '$user'
                },
                {
                    $sort: { createdAt: -1 }
                }
            ]).toArray();
    }

    // Xử lý yêu cầu hủy (admin)
    static async processCancelRequest(requestId, adminId, action, adminNote = '') {
        const db = getDb();
        
        const updateData = {
            status: action === 'approve' ? 'Đã chấp nhận' : 'Đã từ chối',
            processedAt: new Date(),
            processedBy: new ObjectId(adminId),
            adminNote: adminNote
        };

        // Cập nhật trạng thái yêu cầu hủy
        await db.collection('cancelRequests').updateOne(
            { _id: new ObjectId(requestId) },
            { $set: updateData }
        );

        // Nếu chấp nhận, hủy đơn hàng và khôi phục kho
        if (action === 'approve') {
            const request = await db.collection('cancelRequests').findOne({ 
                _id: new ObjectId(requestId) 
            });
            
            if (request) {
                // Hủy đơn hàng
                await this.cancelOrder(request.orderId);
                
                // Khôi phục số lượng sản phẩm trong kho
                const order = await this.getOrderById(request.orderId);
                if (order) {
                    for (const item of order.items) {
                        await db.collection('products').updateOne(
                            { _id: new ObjectId(item.productId) },
                            { $inc: { quantity: item.quantity } }
                        );
                    }
                }
            }
        }

        return true;
    }

    // Lưu mã giao dịch VNPay vào đơn hàng
    static async updateOrderWithVNPayTransactionNo(orderId, vnp_TransactionNo) {
        const db = getDb();
        try {
            const result = await db.collection('orders').updateOne(
                { _id: new ObjectId(orderId) },
                { $set: { 'paymentInfo.vnp_TransactionNo': vnp_TransactionNo } }
            );
            
            if (result.matchedCount === 0) {
                console.error(`Không tìm thấy đơn hàng với ID: ${orderId}`);
                throw new Error(`Không tìm thấy đơn hàng với ID: ${orderId}`);
            }
            
            if (result.modifiedCount === 0) {
                console.warn(`Đơn hàng ${orderId} đã có mã giao dịch VNPay hoặc không có thay đổi`);
            }
            
            console.log(`Đã cập nhật mã giao dịch VNPay: ${vnp_TransactionNo} cho đơn hàng: ${orderId}`);
            return result;
        } catch (error) {
            console.error(`Lỗi khi cập nhật mã giao dịch VNPay cho đơn hàng ${orderId}:`, error);
            throw error;
        }
    }
}

module.exports = Order; 
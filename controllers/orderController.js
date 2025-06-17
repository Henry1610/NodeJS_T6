const Order = require('../models/Order');
const Product = require('../models/product');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.getAllOrders();
        
        // Thêm các hàm helper cho template
        res.locals.getStatusClass = (status) => {
            switch(status) {
                case 'Chờ xác nhận': return 'bg-warning text-dark';
                case 'Đã xác nhận': return 'bg-info text-white';
                case 'Đang giao hàng': return 'bg-primary text-white';
                case 'Đã giao hàng': return 'bg-success text-white';
                case 'Đã hủy': return 'bg-danger text-white';
                default: return 'bg-secondary text-white';
            }
        };
        
        res.locals.getStatusIcon = (status) => {
            switch(status) {
                case 'Chờ xác nhận': return 'fa-clock';
                case 'Đã xác nhận': return 'fa-check-circle';
                case 'Đang giao hàng': return 'fa-shipping-fast';
                case 'Đã giao hàng': return 'fa-box-check';
                case 'Đã hủy': return 'fa-times-circle';
                default: return 'fa-question-circle';
            }
        };
        
        res.render('admin/order/orderlist', {
            title: 'Quản lý đơn hàng',
            orders: orders
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        res.redirect('/admin/dashboard');
    }
};

exports.getOrderDetail = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.getOrderById(orderId);
        
        if (!order) {
            return res.redirect('/admin/orders');
        }
        
        // Thêm các hàm helper cho template
        res.locals.getStatusButtonClass = (status) => {
            switch(status) {
                case 'Chờ xác nhận': return 'btn-warning';
                case 'Đã xác nhận': return 'btn-info';
                case 'Đang giao hàng': return 'btn-primary';
                case 'Đã giao hàng': return 'btn-success';
                case 'Đã hủy': return 'btn-danger';
                default: return 'btn-secondary';
            }
        };
        
        res.locals.getStatusIcon = (status) => {
            switch(status) {
                case 'Chờ xác nhận': return 'fa-clock';
                case 'Đã xác nhận': return 'fa-check-circle';
                case 'Đang giao hàng': return 'fa-shipping-fast';
                case 'Đã giao hàng': return 'fa-box-check';
                case 'Đã hủy': return 'fa-times-circle';
                default: return 'fa-question-circle';
            }
        };
        
        res.render('admin/order/orderdetail', {
            title: 'Chi tiết đơn hàng',
            order: order
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
        res.redirect('/admin/orders');
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.status;
        
        if (!orderId || !newStatus) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông tin cần thiết' 
            });
        }
        
        // Danh sách trạng thái hợp lệ
        const validStatuses = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
        
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Trạng thái không hợp lệ' 
            });
        }
        
        // Kiểm tra đơn hàng tồn tại
        const order = await Order.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy đơn hàng' 
            });
        }
        
        // Xử lý đặc biệt khi hủy đơn hàng
        if (newStatus === 'Đã hủy' && order.status !== 'Đã hủy') {
            // Khôi phục số lượng sản phẩm trong kho
            const db = require('../util/database').getDb();
            
            for (const item of order.items) {
                await db.collection('products').updateOne(
                    { _id: new ObjectId(item.productId) },
                    { $inc: { quantity: item.quantity } }
                );
            }
        }
        
        // Cập nhật trạng thái đơn hàng
        await Order.updateOrderStatus(orderId, newStatus);
        
        return res.status(200).json({ 
            success: true, 
            message: 'Cập nhật trạng thái đơn hàng thành công',
            newStatus: newStatus
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng' 
        });
    }
};

// Controller cho phía người dùng
exports.getUserOrders = async (req, res, next) => {
    try {
        const userId = req.session.user._id;
        const orders = await Order.getOrdersByUser(userId);
        
        res.render('user/pages/orders', {
            title: 'Lịch sử đơn hàng',
            orders: orders
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        res.redirect('/user');
    }
};

exports.getUserOrderDetail = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user._id;
        const order = await Order.getOrderById(orderId);
        
        if (!order || order.user._id.toString() !== userId.toString()) {
            return res.redirect('/user/orders');
        }
        
        res.render('user/pages/order-detail', {
            title: 'Chi tiết đơn hàng',
            order: order
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
        res.redirect('/user/orders');
    }
};

exports.cancelOrder = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const userId = req.session.user._id;
        
        // Kiểm tra đơn hàng tồn tại và thuộc về người dùng
        const order = await Order.getOrderById(orderId);
        if (!order || order.user._id.toString() !== userId.toString()) {
            return res.redirect('/user/orders');
        }
        
        // Chỉ cho phép hủy đơn hàng ở trạng thái "Chờ xác nhận"
        if (order.status !== 'Chờ xác nhận') {
            req.flash('error', 'Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận');
            return res.redirect('/user/order/' + orderId);
        }
        
        // Khôi phục số lượng sản phẩm trong kho
        const db = require('../util/database').getDb();
        
        for (const item of order.items) {
            await db.collection('products').updateOne(
                { _id: new ObjectId(item.productId) },
                { $inc: { quantity: item.quantity } }
            );
        }
        
        // Hủy đơn hàng
        await Order.cancelOrder(orderId);
        
        req.flash('success', 'Đơn hàng đã được hủy thành công');
        res.redirect('/user/orders');
    } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
        req.flash('error', 'Đã xảy ra lỗi khi hủy đơn hàng');
        res.redirect('/user/orders');
    }
}; 
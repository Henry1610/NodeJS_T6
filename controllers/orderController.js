const Order = require('../models/Order');
const Product = require('../models/product');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const {VNPay, ProductCode, dateFormat} = require('vnpay');

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
        
        // Lấy thông tin yêu cầu hủy nếu có
        const cancelRequest = await Order.getCancelRequestByOrderId(orderId);
        
        res.render('user/pages/order-detail', {
            title: 'Chi tiết đơn hàng',
            order: order,
            cancelRequest: cancelRequest
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
        const reason = req.body.reason || '';
        
        // Kiểm tra đơn hàng tồn tại và thuộc về người dùng
        const order = await Order.getOrderById(orderId);
        if (!order || order.user._id.toString() !== userId.toString()) {
            return res.redirect('/user/orders');
        }
        
        // Kiểm tra trạng thái đơn hàng để quyết định có thể yêu cầu hủy hay không
        const cancellableStatuses = ['Chờ xác nhận', 'Đã xác nhận'];
        const cannotCancelStatuses = ['Đã giao hàng', 'Đã hủy'];
        
        if (cannotCancelStatuses.includes(order.status)) {
            let errorMessage = '';
            if (order.status === 'Đã giao hàng') {
                errorMessage = 'Không thể yêu cầu hủy đơn hàng đã được giao thành công';
            } else if (order.status === 'Đã hủy') {
                errorMessage = 'Đơn hàng đã được hủy trước đó';
            }
            req.flash('error', errorMessage);
            return res.redirect('/user/order/' + orderId);
        }
        
        if (!cancellableStatuses.includes(order.status)) {
            req.flash('error', 'Không thể yêu cầu hủy đơn hàng đang trong quá trình giao hàng. Vui lòng liên hệ với chúng tôi.');
            return res.redirect('/user/order/' + orderId);
        }
        
        // Kiểm tra xem đã có yêu cầu hủy chưa
        const existingRequest = await Order.getCancelRequestByOrderId(orderId);
        if (existingRequest) {
            if (existingRequest.status === 'Chờ xử lý') {
                req.flash('error', 'Bạn đã gửi yêu cầu hủy cho đơn hàng này. Vui lòng chờ admin xử lý.');
            } else if (existingRequest.status === 'Đã chấp nhận') {
                req.flash('success', 'Yêu cầu hủy đã được chấp nhận. Đơn hàng đã được hủy.');
            } else if (existingRequest.status === 'Đã từ chối') {
                req.flash('error', 'Yêu cầu hủy đã bị từ chối. Vui lòng liên hệ với chúng tôi nếu cần hỗ trợ.');
            }
            return res.redirect('/user/order/' + orderId);
        }
        
        // Tạo yêu cầu hủy
        await Order.createCancelRequest(orderId, userId, reason);
        
        req.flash('success', 'Yêu cầu hủy đơn hàng đã được gửi. Admin sẽ xem xét và phản hồi trong thời gian sớm nhất.');
        res.redirect('/user/order/' + orderId);
    } catch (error) {
        console.error('Lỗi khi tạo yêu cầu hủy đơn hàng:', error);
        req.flash('error', 'Đã xảy ra lỗi khi gửi yêu cầu hủy đơn hàng');
        res.redirect('/user/orders');
    }
};

// Controller cho admin xử lý yêu cầu hủy
exports.getCancelRequests = async (req, res, next) => {
    try {
        const cancelRequests = await Order.getAllCancelRequests();
        
        res.render('admin/order/cancel-requests', {
            title: 'Yêu cầu hủy đơn hàng',
            cancelRequests: cancelRequests
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách yêu cầu hủy:', error);
        res.redirect('/admin/dashboard');
    }
};

exports.processCancelRequest = async (req, res, next) => {
    try {
        const requestId = req.params.requestId;
        const adminId = req.session.user._id;
        const { action, adminNote } = req.body;
        
        if (!requestId || !action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thông tin không hợp lệ' 
            });
        }
        
        // Lấy thông tin yêu cầu hủy
        const request = await Order.getCancelRequestById(requestId);
        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy yêu cầu hủy' 
            });
        }
        
        // Lấy thông tin đơn hàng
        const order = await Order.getOrderById(request.orderId);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy đơn hàng' 
            });
        }
        
        // Nếu chấp nhận và đơn hàng thanh toán qua VNPay, thực hiện hoàn tiền
        if (action === 'approve' && order.paymentInfo && order.paymentInfo.method === 'VNPay') {
            try {
                console.log('Bắt đầu xử lý hoàn tiền VNPay cho đơn hàng:', order._id);
                const refundResult = await processVNPayRefund(order);
                
                if (!refundResult.success) {
                    console.error('Lỗi hoàn tiền VNPay:', refundResult.message);
                    return res.status(500).json({ 
                        success: false, 
                        message: `Lỗi hoàn tiền VNPay: ${refundResult.message}` 
                    });
                }
                
                console.log('Hoàn tiền VNPay thành công:', refundResult);
            } catch (refundError) {
                console.error('Lỗi hoàn tiền VNPay:', refundError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Đã xảy ra lỗi khi hoàn tiền qua VNPay: ' + refundError.message 
                });
            }
        }
        
        await Order.processCancelRequest(requestId, adminId, action, adminNote);
        
        return res.status(200).json({ 
            success: true, 
            message: action === 'approve' ? 'Đã chấp nhận yêu cầu hủy' : 'Đã từ chối yêu cầu hủy'
        });
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu hủy:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi khi xử lý yêu cầu hủy: ' + error.message 
        });
    }
};

// Hàm xử lý hoàn tiền VNPay
async function processVNPayRefund(order) {
    try {
        // Kiểm tra xem đơn hàng có mã giao dịch VNPay không
        if (!order.paymentInfo || !order.paymentInfo.vnp_TransactionNo) {
            throw new Error('Không tìm thấy mã giao dịch VNPay của đơn hàng này. Vui lòng kiểm tra lại thông tin thanh toán.');
        }

        // Tạo mã giao dịch hoàn tiền
        const refundTxnRef = `REFUND_${order._id}_${Date.now()}`;
        
        console.log('Refund details:', {
            orderId: order._id,
            originalTransactionNo: order.paymentInfo.vnp_TransactionNo,
            refundAmount: order.paymentInfo.finalAmount,
            refundTxnRef: refundTxnRef
        });
        
        // Lưu thông tin hoàn tiền vào database để admin thực hiện thủ công
        await Order.saveRefundInfo(order._id, {
            refundTxnRef: refundTxnRef,
            refundAmount: order.paymentInfo.finalAmount,
            refundStatus: 'pending',
            refundDate: new Date(),
            originalTransactionId: order.paymentInfo.vnp_TransactionNo, // Mã giao dịch gốc
            note: `Hoàn tiền cho đơn hàng ${order._id} - Thanh toán qua VNPay`,
            adminInstructions: {
                vnp_TransactionNo: order.paymentInfo.vnp_TransactionNo,
                refundAmount: order.paymentInfo.finalAmount,
                refundReason: `Hủy đơn hàng ${order._id}`,
                merchantId: 'PX2DIOF7',
                instructions: [
                    '1. Đăng nhập vào VNPay Merchant Dashboard',
                    '2. Vào mục "Giao dịch" hoặc "Quản lý giao dịch"',
                    '3. Tìm giao dịch có mã: ' + order.paymentInfo.vnp_TransactionNo,
                    '4. Chọn "Hoàn tiền" hoặc "Refund"',
                    '5. Nhập số tiền hoàn: ' + order.paymentInfo.finalAmount.toLocaleString('vi-VN') + ' VND',
                    '6. Nhập lý do: Hủy đơn hàng ' + order._id,
                    '7. Xác nhận hoàn tiền'
                ]
            }
        });

        console.log('VNPay refund info saved for manual processing');
        
        return {
            success: true,
            message: 'Đã lưu thông tin hoàn tiền. Admin cần thực hiện hoàn tiền thủ công trên VNPay Dashboard.',
            refundTxnRef: refundTxnRef,
            originalTransactionNo: order.paymentInfo.vnp_TransactionNo,
            refundAmount: order.paymentInfo.finalAmount,
            adminInstructions: {
                vnp_TransactionNo: order.paymentInfo.vnp_TransactionNo,
                refundAmount: order.paymentInfo.finalAmount,
                refundReason: `Hủy đơn hàng ${order._id}`,
                merchantId: 'PX2DIOF7'
            }
        };
    } catch (error) {
        console.error('Lỗi tạo thông tin hoàn tiền VNPay:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Hiển thị trang thông tin hoàn tiền VNPay
exports.getRefundInfo = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.getOrderById(orderId);
        
        if (!order) {
            return res.redirect('/admin/orders');
        }
        
        res.render('admin/order/refund-info', {
            title: 'Thông tin Hoàn tiền VNPay',
            order: order
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin hoàn tiền:', error);
        res.redirect('/admin/orders');
    }
};

// Cập nhật trạng thái hoàn tiền
exports.updateRefundStatus = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const { newRefundStatus, refundNote } = req.body;
        
        if (!orderId || !newRefundStatus) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông tin cần thiết' 
            });
        }
        
        // Danh sách trạng thái hợp lệ
        const validStatuses = ['pending', 'completed', 'failed'];
        
        if (!validStatuses.includes(newRefundStatus)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Trạng thái không hợp lệ' 
            });
        }
        
        // Cập nhật trạng thái hoàn tiền
        const updateData = {
            'refundInfo.refundStatus': newRefundStatus,
            'refundInfo.updatedAt': new Date()
        };
        
        if (refundNote) {
            updateData['refundInfo.adminNote'] = refundNote;
        }
        
        const db = require('../util/database').getDb();
        await db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { $set: updateData }
        );
        
        return res.status(200).json({ 
            success: true, 
            message: 'Cập nhật trạng thái hoàn tiền thành công',
            newStatus: newRefundStatus
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái hoàn tiền:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi khi cập nhật trạng thái hoàn tiền: ' + error.message 
        });
    }
}; 
# Hướng dẫn Hoàn tiền VNPay

## Tổng quan
Hệ thống đã được cập nhật để hỗ trợ hoàn tiền VNPay một cách chính xác. **Lưu ý quan trọng:** VNPay không hỗ trợ hoàn tiền qua URL, mà phải thực hiện thủ công trên VNPay Merchant Dashboard.

## Các thay đổi chính

### 1. Lưu mã giao dịch VNPay
- Khi thanh toán thành công, callback VNPay sẽ lưu `vnp_TransactionNo` vào `order.paymentInfo.vnp_TransactionNo`
- Mã này được sử dụng để xác định giao dịch gốc cần hoàn tiền

### 2. Hoàn tiền thủ công trên VNPay Dashboard
- Thay vì tạo URL hoàn tiền, hệ thống lưu thông tin hoàn tiền và hướng dẫn admin
- Admin thực hiện hoàn tiền trực tiếp trên VNPay Merchant Dashboard

### 3. Trang quản lý hoàn tiền
- Tạo trang admin riêng để xem thông tin hoàn tiền
- Hướng dẫn chi tiết cách thực hiện hoàn tiền
- Cập nhật trạng thái hoàn tiền

## Cách sử dụng

### 1. Tạo đơn hàng và thanh toán VNPay
```bash
# Đặt hàng và chọn thanh toán VNPay
# Sau khi thanh toán thành công, kiểm tra log:
# "Đã lưu mã giao dịch VNPay: [số] cho đơn hàng: [orderId]"
```

### 2. Yêu cầu hủy đơn hàng
- Người dùng tạo yêu cầu hủy từ trang chi tiết đơn hàng
- Admin xem danh sách yêu cầu hủy tại `/admin/cancel-requests`

### 3. Admin chấp nhận hủy
- Admin chấp nhận yêu cầu hủy
- Hệ thống lưu thông tin hoàn tiền với hướng dẫn chi tiết
- Admin truy cập `/admin/refund/[orderId]` để xem thông tin hoàn tiền

### 4. Thực hiện hoàn tiền trên VNPay Dashboard
- Đăng nhập vào VNPay Merchant Dashboard
- Tìm giao dịch theo mã giao dịch đã lưu
- Thực hiện hoàn tiền theo hướng dẫn
- Cập nhật trạng thái hoàn tiền trong hệ thống

## Debug và Troubleshooting

### 1. Kiểm tra thông tin đơn hàng
```bash
GET /api/debug-order/[orderId]
```

### 2. Xem trang thông tin hoàn tiền
```
GET /admin/refund/[orderId]
```

### 3. Test hoàn tiền
```bash
POST /api/test-refund
Content-Type: application/json

{
  "orderId": "[orderId]"
}
```

### 4. Kiểm tra log
Các log quan trọng:
```
# Khi thanh toán thành công:
"Đã lưu mã giao dịch VNPay: [số] cho đơn hàng: [orderId]"

# Khi bắt đầu hoàn tiền:
"Bắt đầu xử lý hoàn tiền VNPay cho đơn hàng: [orderId]"
"Refund details: { orderId, originalTransactionNo, refundAmount, refundTxnRef }"

# Khi lưu thông tin hoàn tiền:
"VNPay refund info saved for manual processing"
```

## Lý do không sử dụng URL hoàn tiền

### Vấn đề với URL hoàn tiền:
1. **VNPay không hỗ trợ hoàn tiền qua URL** - đây là giới hạn của VNPay
2. **Lỗi "Có lỗi xảy ra trong quá trình xử lý"** khi truy cập URL hoàn tiền
3. **Không hiển thị trong dashboard** - giao dịch hoàn tiền không xuất hiện

### Giải pháp thay thế:
1. **Hoàn tiền thủ công** trên VNPay Merchant Dashboard
2. **Lưu thông tin hoàn tiền** trong hệ thống để theo dõi
3. **Hướng dẫn chi tiết** cho admin thực hiện

## Cấu trúc Database

### Order Collection
```javascript
{
  _id: ObjectId,
  paymentInfo: {
    method: "VNPay",
    finalAmount: 100000,
    vnp_TransactionNo: "12345678" // Mã giao dịch VNPay
  },
  refundInfo: {
    refundTxnRef: "REFUND_orderId_timestamp",
    refundAmount: 100000,
    refundStatus: "pending|completed|failed",
    originalTransactionId: "12345678",
    adminInstructions: {
      vnp_TransactionNo: "12345678",
      refundAmount: 100000,
      refundReason: "Hủy đơn hàng orderId",
      merchantId: "PX2DIOF7",
      instructions: ["Bước 1", "Bước 2", ...]
    }
  }
}
```

## API Endpoints

### 1. Debug Order
```
GET /api/debug-order/:orderId
```

### 2. Test Refund
```
POST /api/test-refund
Body: { "orderId": "..." }
```

### 3. VNPay Callback
```
GET /api/check-payment-vnpay
```

### 4. Thông tin Hoàn tiền
```
GET /admin/refund/:orderId
```

### 5. Cập nhật Trạng thái Hoàn tiền
```
POST /admin/update-refund-status/:orderId
Body: { "newRefundStatus": "completed", "refundNote": "..." }
```

## Hướng dẫn Admin

### Bước 1: Xem thông tin hoàn tiền
1. Truy cập `/admin/refund/[orderId]`
2. Xem thông tin chi tiết về giao dịch cần hoàn tiền

### Bước 2: Thực hiện hoàn tiền trên VNPay Dashboard
1. Đăng nhập vào VNPay Merchant Dashboard
2. Vào mục "Giao dịch" hoặc "Quản lý giao dịch"
3. Tìm giao dịch theo mã: `[vnp_TransactionNo]`
4. Chọn "Hoàn tiền" hoặc "Refund"
5. Nhập số tiền và lý do hoàn tiền
6. Xác nhận hoàn tiền

### Bước 3: Cập nhật trạng thái
1. Quay lại trang thông tin hoàn tiền
2. Cập nhật trạng thái thành "Hoàn thành"
3. Thêm ghi chú nếu cần

## Lưu ý quan trọng

1. **Sandbox vs Production:** Đảm bảo sử dụng đúng environment
2. **Mã giao dịch:** VNPay yêu cầu mã giao dịch chính xác để hoàn tiền
3. **Thời gian:** Hoàn tiền chỉ có thể thực hiện trong khoảng thời gian nhất định
4. **Số tiền:** Số tiền hoàn không được vượt quá số tiền giao dịch gốc
5. **Quyền truy cập:** Admin cần có quyền truy cập VNPay Merchant Dashboard

## Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra log console
2. Sử dụng endpoint debug
3. Kiểm tra thông tin trong VNPay dashboard
4. Liên hệ support VNPay nếu cần 
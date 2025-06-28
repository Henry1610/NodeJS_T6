// Debug script cho checkout
console.log('Checkout debug script loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
  
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (placeOrderBtn) {
    console.log('Place order button found');
    
    placeOrderBtn.addEventListener('click', async function() {
      console.log('Place order button clicked');
      
      // Disable button để tránh double click
      placeOrderBtn.disabled = true;
      placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý...';

      try {
        // Validate form
        const checkoutForm = document.getElementById('checkoutForm');
        const formData = new FormData(checkoutForm);
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        console.log('Payment method:', paymentMethod);
        
        // Kiểm tra các trường bắt buộc
        const fullName = formData.get('fullName').trim();
        const phone = formData.get('phone').trim();
        const address = formData.get('address').trim();
        
        console.log('Form data:', { fullName, phone, address });
        
        if (!fullName || !phone || !address) {
          alert('Vui lòng điền đầy đủ thông tin giao hàng');
          placeOrderBtn.disabled = false;
          placeOrderBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Đặt hàng ngay';
          return;
        }

        if (paymentMethod === 'vnpay') {
          console.log('Processing VNPay payment...');
          
          // Tạo đơn hàng trước, sau đó mới tạo URL thanh toán VNPay
          const orderData = {
            fullName: fullName,
            phone: phone,
            address: address,
            note: formData.get('note'),
            paymentMethod: 'VNPay'
          };

          console.log('Order data:', orderData);

          // Tạo đơn hàng trước
          const orderResponse = await fetch('/user/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
          });

          const orderResult = await orderResponse.json();
          
          console.log('Order result:', orderResult);
          
          if (!orderResult.success) {
            alert('Có lỗi xảy ra khi tạo đơn hàng: ' + orderResult.message);
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Đặt hàng ngay';
            return;
          }

          console.log('Order ID:', orderResult.orderId);

          // Sử dụng orderId từ đơn hàng đã tạo để tạo URL VNPay
          const vnpayResponse = await fetch('/api/create-qr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: window.totalAmount || 100000, // Fallback amount
              orderId: orderResult.orderId,
              orderInfo: 'Thanh toan don hang ' + orderResult.orderId
            })
          });

          const vnpayResult = await vnpayResponse.json();
          
          console.log('VNPay result:', vnpayResult);
          
          if (vnpayResult.success) {
            console.log('Payment URL:', vnpayResult.data.paymentUrl);
            // Chuyển hướng đến trang thanh toán VNPay
            window.location.href = vnpayResult.data.paymentUrl;
          } else {
            alert('Có lỗi xảy ra khi tạo QR code thanh toán: ' + vnpayResult.message);
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Đặt hàng ngay';
          }
        } else {
          console.log('Processing COD payment...');
          
          // Thanh toán COD - tạo đơn hàng trực tiếp
          const orderData = {
            fullName: fullName,
            phone: phone,
            address: address,
            note: formData.get('note'),
            paymentMethod: 'COD'
          };

          const response = await fetch('/user/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
          });

          const result = await response.json();
          
          console.log('Response from checkout:', result);
          
          if (result.success) {
            // Chuyển hướng đến trang thành công
            if (result.redirectUrl) {
              window.location.href = result.redirectUrl;
            } else if (result.orderId) {
              // Fallback nếu không có redirectUrl
              window.location.href = '/user/checkout/success/' + result.orderId;
            } else {
              alert('Đặt hàng thành công nhưng không thể chuyển hướng. Vui lòng kiểm tra đơn hàng của bạn.');
              window.location.href = '/user/orders';
            }
          } else {
            alert('Có lỗi xảy ra khi đặt hàng: ' + result.message);
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Đặt hàng ngay';
          }
        }
      } catch (error) {
        console.error('Lỗi khi đặt hàng:', error);
        alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Đặt hàng ngay';
      }
    });
  } else {
    console.log('Place order button not found');
  }
}); 
// Checkout JavaScript
let discountValue = 0;
let appliedDiscountCode = '';
let finalAmount = 0;

document.addEventListener('DOMContentLoaded', function() {
  console.log('Checkout script loaded');
  
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const discountCodeInput = document.getElementById('discountCode');
  const discountAppliedAmount = document.getElementById('discountAppliedAmount');
  const discountAppliedRow = document.getElementById('discountAppliedRow');
  const cartTotalElement = document.querySelector('[data-total-amount]');
  const showDiscountsBtn = document.getElementById('showDiscountsBtn');
  const discountsModal = document.getElementById('discountsModal');
  const discountsListDiv = document.getElementById('discountsList');

  if (!placeOrderBtn || !checkoutForm) {
    console.error('Required elements not found');
    return;
  }

  // Lấy totalAmount từ global variable hoặc data attribute
  const totalAmountElement = document.querySelector('[data-total-amount]');
  const totalAmount = totalAmountElement ? parseInt(totalAmountElement.dataset.totalAmount) : 0;
  finalAmount = totalAmount;
  
  console.log('Total amount:', totalAmount);

  // Lấy danh sách mã giảm giá
  fetch('/user/cart/available-discounts')
    .then(res => res.json())
    .then(data => { 
      window.discountsList = data.discounts || []; 
      console.log('Available discounts:', window.discountsList);
      
      // Sau khi load xong danh sách, kiểm tra discount code từ URL
      const urlParams = new URLSearchParams(window.location.search);
      const discountCodeFromUrl = urlParams.get('discountCode');
      if (discountCodeFromUrl && discountCodeInput) {
        discountCodeInput.value = discountCodeFromUrl;
        console.log('Auto-filled discount code from URL:', discountCodeFromUrl);
        // Trigger input event để tính toán lại
        discountCodeInput.dispatchEvent(new Event('input'));
      }
    });

  // Auto-fill discount code từ URL parameter (fallback nếu fetch chậm)
  const urlParams = new URLSearchParams(window.location.search);
  const discountCodeFromUrl = urlParams.get('discountCode');
  if (discountCodeFromUrl && discountCodeInput) {
    discountCodeInput.value = discountCodeFromUrl;
    console.log('Auto-filled discount code from URL (fallback):', discountCodeFromUrl);
  }

  // Xử lý modal danh sách mã giảm giá
  if (showDiscountsBtn && discountsModal && discountsListDiv) {
    const discountsModalInstance = new bootstrap.Modal(discountsModal);
    
    showDiscountsBtn.addEventListener('click', function() {
      const discounts = window.discountsList || [];
      discountsListDiv.innerHTML = discounts.length > 0 ? discounts.map(d => `
        <div class='card mb-2'>
          <div class='card-body'>
            <div class='d-flex justify-content-between align-items-center'>
              <div>
                <span class='badge bg-success'>${d.code}</span>
                <span class='ms-2'>${d.description || ''}</span>
                <div class='small text-muted'>
                  Giảm: ${d.value.toLocaleString('vi-VN')} VNĐ, 
                  Đơn tối thiểu: ${d.min_order_value.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
              <button type="button" class="btn btn-primary btn-sm apply-discount-btn" data-code="${d.code}">Áp dụng</button>
            </div>
          </div>
        </div>
      `).join('') : '<div class="alert alert-info">Không có mã giảm giá nào khả dụng.</div>';
      
      setTimeout(() => {
        document.querySelectorAll('.apply-discount-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            if (discountCodeInput) discountCodeInput.value = this.dataset.code;
            discountsModalInstance.hide();
            if (discountCodeInput) discountCodeInput.dispatchEvent(new Event('input'));
          });
        });
      }, 0);
      discountsModalInstance.show();
    });
  }

  // Xử lý nhập mã giảm giá
  if (discountCodeInput) {
    discountCodeInput.addEventListener('input', function() {
      const code = this.value.trim();
      const discounts = window.discountsList || [];
      const discount = discounts.find(d => d.code === code);
      
      if (discount && totalAmount >= discount.min_order_value) {
        discountValue = discount.value;
        appliedDiscountCode = code;
        finalAmount = Math.max(0, totalAmount - discountValue);
        
        // Hiển thị số tiền đã giảm
        if (discountAppliedAmount) {
          discountAppliedAmount.textContent = `-${discountValue.toLocaleString('vi-VN')} VNĐ`;
        }
        if (discountAppliedRow) {
          discountAppliedRow.style.display = 'flex';
        }
        
        // Cập nhật tổng tiền
        if (cartTotalElement) {
          cartTotalElement.textContent = finalAmount.toLocaleString('vi-VN') + ' VNĐ';
        }
        
        console.log('Discount applied:', { code, discountValue, finalAmount });
      } else {
        discountValue = 0;
        appliedDiscountCode = '';
        finalAmount = totalAmount;
        
        // Ẩn số tiền đã giảm
        if (discountAppliedAmount) {
          discountAppliedAmount.textContent = '0 VNĐ';
        }
        if (discountAppliedRow) {
          discountAppliedRow.style.display = 'none';
        }
        
        // Cập nhật tổng tiền
        if (cartTotalElement) {
          cartTotalElement.textContent = totalAmount.toLocaleString('vi-VN') + ' VNĐ';
        }
        
        console.log('No discount applied, final amount:', finalAmount);
      }
    });
  }

  placeOrderBtn.addEventListener('click', async function() {
    console.log('Place order button clicked');
    
    // Disable button để tránh double click
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý...';

    try {
      // Validate form
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
          paymentMethod: 'VNPay',
          discountCode: appliedDiscountCode,
          discountValue: discountValue,
          amount: finalAmount // Gửi số tiền đã trừ giảm giá
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
        console.log('Order ID:', orderResult.orderId);
        
        if (!orderResult.success) {
          alert('Có lỗi xảy ra khi tạo đơn hàng: ' + orderResult.message);
          placeOrderBtn.disabled = false;
          placeOrderBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Đặt hàng ngay';
          return;
        }

        if (!orderResult.orderId) {
          alert('Có lỗi: Không nhận được ID đơn hàng');
          placeOrderBtn.disabled = false;
          placeOrderBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Đặt hàng ngay';
          return;
        }

        console.log('Order ID for VNPay:', orderResult.orderId);

        // Sử dụng orderId từ đơn hàng đã tạo để tạo URL VNPay
        const vnpayData = {
          amount: finalAmount, // Số tiền đã trừ giảm giá
          orderId: orderResult.orderId.toString(),
          orderInfo: 'Thanh toan don hang ' + orderResult.orderId.toString()
        };
        
        console.log('VNPay data:', vnpayData);
        
        const vnpayResponse = await fetch('/api/create-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vnpayData)
        });

        const vnpayResult = await vnpayResponse.json();
        
        console.log('VNPay result:', vnpayResult);
        
        if (vnpayResult.success && vnpayResult.data) {
          // Chuyển hướng đến trang thanh toán VNPay
          window.location.href = vnpayResult.data;
        } else {
          console.error('VNPay error:', vnpayResult);
          alert('Có lỗi xảy ra khi tạo QR code thanh toán: ' + (vnpayResult.message || 'Lỗi không xác định'));
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
          paymentMethod: 'COD',
          discountCode: appliedDiscountCode,
          discountValue: discountValue,
          amount: finalAmount // Gửi số tiền đã trừ giảm giá
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
}); 
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const mongoConnect = require('./database').mongoConnect;

const createUser = async () => {
  try {
    await mongoConnect();
    
    const email = 'user@example.com';
    const password = 'user123';
    
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      console.log('Tài khoản user đã tồn tại!');
      process.exit(0);
    }
    
    // Tạo mật khẩu mã hóa
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Tạo tài khoản user
    const user = new User(email, hashedPassword, 'user');
    await user.save();
    
    console.log('Tài khoản user đã được tạo thành công!');
    console.log('Email: ' + email);
    console.log('Mật khẩu: ' + password);
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi tạo tài khoản user:', err);
    process.exit(1);
  }
};

createUser(); 
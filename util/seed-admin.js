const bcrypt = require('bcryptjs');
const User = require('../models/User');
const mongoConnect = require('./database').mongoConnect;

const seedAdmin = async () => {
  try {
    await mongoConnect();
    
    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await User.findByEmail('admin@example.com');
    
    if (existingAdmin) {
      console.log('Admin account already exists!');
      process.exit(0);
    }
    
    // Tạo mật khẩu mã hóa
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Tạo tài khoản admin
    const admin = new User('admin@example.com', hashedPassword, 'admin');
    await admin.save();
    
    console.log('Admin account created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin account:', err);
    process.exit(1);
  }
};

seedAdmin(); 
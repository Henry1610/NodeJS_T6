const nodemailer = require('nodemailer');

// Cấu hình transporter cho Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER || 'trannguyentruong6@gmail.com', // Thay bằng email gửi
    pass: process.env.MAIL_PASS || 'ibkk kqof dqcn tsmt'      // Thay bằng mật khẩu ứng dụng
  }
});

/**
 * Gửi email
 * @param {string} to - Email người nhận
 * @param {string} subject - Tiêu đề
 * @param {string} html - Nội dung HTML
 */
async function sendMail(to, subject, html) {
  const mailOptions = {
    from: process.env.MAIL_USER || 'your-email@gmail.com',
    to,
    subject,
    html
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendMail }; 
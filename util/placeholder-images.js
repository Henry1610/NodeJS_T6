// Danh sách các URL ảnh placeholder để sử dụng khi không có ảnh mẫu thực tế
module.exports = {
    // Các URL ảnh mẫu từ placeholder.com - một dịch vụ cung cấp ảnh mẫu
    placeholders: [
        '/images/1744089624200.jpg',
        '/images/1744089614921.webp',
        '/images/1744089519027.webp',
        '/images/1744089431036.webp',
        '/images/1744218196236.webp',
        '/images/1744217893010.jpg',
        '/images/1744303022730.jpg',
        '/images/1744303015310.webp',
        '/images/1744303714186.webp',
        '/images/1744089647347.webp',
    ],
    
    // Phương thức lấy URL ảnh placeholder ngẫu nhiên
    getRandomPlaceholder: function() {
        const randomIndex = Math.floor(Math.random() * this.placeholders.length);
        return this.placeholders[randomIndex];
    }
}; 
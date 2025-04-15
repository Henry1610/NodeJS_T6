const path = require('path');
const fs = require('fs');
const mongodb = require('mongodb');
const Category = require('../models/category');
const Brand = require('../models/brand');
const Product = require('../models/product');
const mongoConnect = require('./database').mongoConnect;
const placeholderImages = require('./placeholder-images');

// Danh sách danh mục thực tế
const categories = [
    { name: 'Smartphone' },
    { name: 'Laptop' },
    { name: 'Tablet' },
    { name: 'Smart TV' },
    { name: 'Headphone' },
    { name: 'Camera' },
    { name: 'Smartwatch' },
    { name: 'Gaming' }
];

// Danh sách thương hiệu thực tế
const brands = [
    { name: 'Apple', description: 'Công ty công nghệ đa quốc gia của Mỹ' },
    { name: 'Samsung', description: 'Tập đoàn đa quốc gia của Hàn Quốc' },
    { name: 'Xiaomi', description: 'Công ty công nghệ Trung Quốc' },
    { name: 'Dell', description: 'Công ty máy tính đa quốc gia của Mỹ' },
    { name: 'HP', description: 'Hewlett-Packard - Công ty công nghệ hàng đầu của Mỹ' },
    { name: 'Asus', description: 'Công ty máy tính Đài Loan' },
    { name: 'Lenovo', description: 'Tập đoàn công nghệ đa quốc gia của Trung Quốc' },
    { name: 'Sony', description: 'Tập đoàn đa quốc gia của Nhật Bản' },
    { name: 'LG', description: 'Tập đoàn điện tử Hàn Quốc' },
    { name: 'Huawei', description: 'Công ty công nghệ đa quốc gia của Trung Quốc' }
];

// Danh sách hình ảnh
const copySampleImages = async () => {
    const sourceDir = path.join(__dirname, 'sample-images');
    const destDir = path.join(__dirname, '..', 'public', 'images');
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Danh sách hình ảnh mẫu (giả định các file này tồn tại)
    const imagesToCopy = [
        'iphone15.jpg',
        'macbook.jpg',
        'samsung-galaxy.jpg',
        'xiaomi-pad.jpg',
        'dell-xps.jpg',
        'galaxy-watch.jpg',
        'sony-tv.jpg',
        'airpods.jpg',
        'lg-oled.jpg',
        'ps5.jpg'
    ];
    
    // Kiểm tra xem thư mục nguồn có tồn tại không
    if (!fs.existsSync(sourceDir)) {
        console.log(`Thư mục ${sourceDir} không tồn tại. Sẽ sử dụng URL ảnh mẫu.`);
        return [];
    }
    
    // Copy từng file
    const copiedImages = [];
    for (const image of imagesToCopy) {
        const sourcePath = path.join(sourceDir, image);
        const destPath = path.join(destDir, image);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            copiedImages.push(image);
            console.log(`Đã copy ${image}`);
        }
    }
    
    return copiedImages;
};

// Sản phẩm mẫu
const generateProducts = (categoryIds, brandIds, copiedImages) => {
    // Sử dụng ảnh mẫu nếu có, hoặc sử dụng URL placeholder
    const getImageUrl = (index) => {
        if (copiedImages.length > 0 && copiedImages[index % copiedImages.length]) {
            return `/images/${copiedImages[index % copiedImages.length]}`;
        }
        return placeholderImages.placeholders[index % placeholderImages.placeholders.length];
    };
    
    // Tạo sản phẩm thực tế
    return [
        {
            title: 'iPhone 15 Pro Max',
            category: categoryIds[0], // Smartphone
            brand: brandIds[0], // Apple
            imgUrl: getImageUrl(0),
            description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình Super Retina XDR 6.7 inch với ProMotion.',
            quantity: 50,
            price: 35990000
        },
        {
            title: 'MacBook Pro 16 inch M3 Max',
            category: categoryIds[1], // Laptop
            brand: brandIds[0], // Apple
            imgUrl: getImageUrl(1),
            description: 'MacBook Pro 16 inch với chip M3 Max, 32GB RAM, 1TB SSD, màn hình Liquid Retina XDR.',
            quantity: 25,
            price: 89990000
        },
        {
            title: 'Samsung Galaxy S23 Ultra',
            category: categoryIds[0], // Smartphone
            brand: brandIds[1], // Samsung
            imgUrl: getImageUrl(2),
            description: 'Samsung Galaxy S23 Ultra với camera 200MP, bút S-Pen, chip Snapdragon 8 Gen 2, màn hình Dynamic AMOLED 2X 6.8 inch.',
            quantity: 40,
            price: 25990000
        },
        {
            title: 'Xiaomi Pad 6',
            category: categoryIds[2], // Tablet
            brand: brandIds[2], // Xiaomi
            imgUrl: getImageUrl(3),
            description: 'Xiaomi Pad 6 với màn hình 11 inch 144Hz, chip Snapdragon 870, pin 8840mAh, sạc nhanh 33W.',
            quantity: 30,
            price: 7990000
        },
        {
            title: 'Dell XPS 17',
            category: categoryIds[1], // Laptop
            brand: brandIds[3], // Dell
            imgUrl: getImageUrl(4),
            description: 'Dell XPS 17 với màn hình 4K UHD+, CPU Intel Core i9, GPU NVIDIA RTX 4070, 32GB RAM, 1TB SSD.',
            quantity: 15,
            price: 69990000
        },
        {
            title: 'Samsung Galaxy Watch 6 Classic',
            category: categoryIds[6], // Smartwatch
            brand: brandIds[1], // Samsung
            imgUrl: getImageUrl(5),
            description: 'Samsung Galaxy Watch 6 Classic với viền xoay vật lý, màn hình AMOLED, đo ECG, theo dõi giấc ngủ nâng cao.',
            quantity: 60,
            price: 9990000
        },
        {
            title: 'Sony Bravia XR A95L OLED',
            category: categoryIds[3], // Smart TV
            brand: brandIds[7], // Sony
            imgUrl: getImageUrl(6),
            description: 'Sony Bravia XR A95L với công nghệ QD-OLED, độ phân giải 4K, bộ xử lý XR, Google TV, perfect for PS5.',
            quantity: 10,
            price: 79990000
        },
        {
            title: 'Apple AirPods Pro 2',
            category: categoryIds[4], // Headphone
            brand: brandIds[0], // Apple
            imgUrl: getImageUrl(7),
            description: 'AirPods Pro 2 với chống ồn chủ động, âm thanh không gian, chip H2, chống nước IPX4.',
            quantity: 100,
            price: 6790000
        },
        {
            title: 'LG OLED evo C3',
            category: categoryIds[3], // Smart TV
            brand: brandIds[8], // LG
            imgUrl: getImageUrl(8),
            description: 'LG OLED evo C3 với bộ xử lý α9 Gen6 AI, Dolby Vision, Dolby Atmos, webOS 23, HDMI 2.1.',
            quantity: 12,
            price: 35990000
        },
        {
            title: 'PlayStation 5 Slim',
            category: categoryIds[7], // Gaming
            brand: brandIds[7], // Sony
            imgUrl: getImageUrl(9),
            description: 'PlayStation 5 Slim với SSD siêu nhanh, hỗ trợ ray tracing, 3D Audio, hỗ trợ 4K 120Hz, DualSense controller.',
            quantity: 20,
            price: 15990000
        },
        {
            title: 'Canon EOS R5',
            category: categoryIds[5], // Camera
            brand: brandIds[7], // Canon (giả sử có trong danh sách)
            imgUrl: getImageUrl(10),
            description: 'Canon EOS R5 với cảm biến full-frame 45MP, quay video 8K, chống rung IBIS 5 trục, kết nối Wi-Fi và Bluetooth.',
            quantity: 15,
            price: 92990000
        },
        {
            title: 'Asus ROG Zephyrus G14',
            category: categoryIds[1], // Laptop
            brand: brandIds[5], // Asus
            imgUrl: getImageUrl(11),
            description: 'Asus ROG Zephyrus G14 với AMD Ryzen 9, GPU NVIDIA RTX 3060, màn hình 14 inch 144Hz, 16GB RAM, 1TB SSD.',
            quantity: 20,
            price: 43990000
        },
        {
            title: 'Huawei MatePad Pro',
            category: categoryIds[2], // Tablet
            brand: brandIds[9], // Huawei
            imgUrl: getImageUrl(12),
            description: 'Huawei MatePad Pro với màn hình OLED 12.6 inch, bút M-Pencil, chip Kirin 9000, pin 10050mAh, sạc nhanh 40W.',
            quantity: 25,
            price: 18990000
        },
        {
            title: 'Sony WH-1000XM5',
            category: categoryIds[4], // Headphone
            brand: brandIds[7], // Sony
            imgUrl: getImageUrl(13),
            description: 'Tai nghe Sony WH-1000XM5 với khả năng chống ồn hàng đầu, 8 micro, âm thanh Hi-Res, thời lượng pin 30 giờ.',
            quantity: 50,
            price: 9490000
        },
        {
            title: 'Lenovo ThinkPad X1 Carbon',
            category: categoryIds[1], // Laptop
            brand: brandIds[6], // Lenovo
            imgUrl: getImageUrl(14),
            description: 'Lenovo ThinkPad X1 Carbon Gen 11 với Intel Core i7, 16GB RAM, 1TB SSD, màn hình 14 inch WQUXGA, bảo mật vân tay.',
            quantity: 18,
            price: 49990000
        }
    ];
};

// Thêm dữ liệu mẫu vào cơ sở dữ liệu
const seedDatabase = async () => {
    try {
        // Kết nối đến cơ sở dữ liệu
        await mongoConnect();
        const db = require('./database').getDb();
        
        console.log('Connected to database. Starting data seeding...');
        
        // Copy hình ảnh mẫu
        const copiedImages = await copySampleImages();
        
        // Xóa dữ liệu cũ
        console.log('Clearing existing data...');
        await db.collection('products').deleteMany({});
        await db.collection('categories').deleteMany({});
        await db.collection('brands').deleteMany({});
        
        // Thêm danh mục
        console.log('Adding categories...');
        const categoryResults = await Promise.all(
            categories.map(category => {
                const newCategory = new Category(category.name);
                return newCategory.save();
            })
        );
        
        // Lấy ID của danh mục
        const categoryDocs = await db.collection('categories').find().toArray();
        const categoryIds = categoryDocs.map(doc => doc._id);
        
        // Thêm thương hiệu
        console.log('Adding brands...');
        const brandResults = await Promise.all(
            brands.map(brand => {
                const newBrand = new Brand(null, brand.name, brand.description);
                return newBrand.save();
            })
        );
        
        // Lấy ID của thương hiệu
        const brandDocs = await db.collection('brands').find().toArray();
        const brandIds = brandDocs.map(doc => doc._id);
        
        // Tạo và thêm sản phẩm
        console.log('Adding products...');
        const products = generateProducts(categoryIds, brandIds, copiedImages);
        
        for (const product of products) {
            const newProduct = new Product(
                null,
                product.title,
                product.imgUrl,
                product.description,
                product.price,
                product.category,
                product.brand,
                product.quantity
            );
            await newProduct.save();
        }
        
        console.log('Database seeding completed successfully.');
        console.log('Added:');
        console.log(`- ${categoryIds.length} categories`);
        console.log(`- ${brandIds.length} brands`);
        console.log(`- ${products.length} products`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Chạy seeder
seedDatabase(); 
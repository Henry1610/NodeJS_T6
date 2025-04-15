// File này dùng để chạy script thêm dữ liệu mẫu
console.log('Starting data seeding process...');

// Lấy tham số từ dòng lệnh
const args = process.argv.slice(2);
const seedType = args[0] || 'sample'; // Mặc định là sample data

try {
    if (seedType === 'admin') {
        console.log('Seeding admin account...');
        require('./util/seed-admin');
    } else if (seedType === 'sample') {
        console.log('Seeding sample data...');
        require('./util/sample-data');
    } else {
        console.log(`Unknown seed type: ${seedType}`);
        console.log('Available options: sample, admin');
    }
} catch (error) {
    console.error(`Error running ${seedType} seed script:`, error);
}

console.log('End of run-seeder.js execution.'); 
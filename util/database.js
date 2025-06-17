const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
let db;

const mongoConnect = () => {
    const uri = 'mongodb+srv://ITCschool:NPKUnuDaGRt8Yvwx@cluster0.jtjkj.mongodb.net/shop?retryWrites=true&w=majority';
    
    return MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
    })
    .then(client => {
        db = client.db('shop');
        console.log('✅ Đã kết nối thành công với MongoDB');
        return db;
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối MongoDB:', err);
        throw err;
    });
};

const getDb = () => {
    if (db) {
        return db;
    }
    throw 'Không tìm thấy database!';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

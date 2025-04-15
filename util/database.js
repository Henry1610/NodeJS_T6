const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
let db;

const mongoConnect = () => {
    return MongoClient.connect('mongodb+srv://ITCschool:NPKUnuDaGRt8Yvwx@cluster0.jtjkj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(client => {
        console.log('✅ Kết nối MongoDB thành công!');
        db = client.db('shop');
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

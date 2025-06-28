const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const getDb = require('../util/database').getDb;

class Review {
    constructor(orderId, userId, productId, rating, comment, createdAt = new Date(), id = null) {
        this.orderId = new ObjectId(orderId);
        this.userId = new ObjectId(userId);
        this.productId = new ObjectId(productId);
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        if (id) this._id = new ObjectId(id);
    }

    async save() {
        const db = getDb();
        return db.collection('reviews').insertOne(this);
    }

    static async findByOrderAndProduct(orderId, productId, userId) {
        const db = getDb();
        return db.collection('reviews').findOne({
            orderId: new ObjectId(orderId),
            productId: new ObjectId(productId),
            userId: new ObjectId(userId)
        });
    }

    static async findByProduct(productId) {
        const db = getDb();
        return db.collection('reviews').find({ productId: new ObjectId(productId) }).toArray();
    }

    static async findByUser(userId) {
        const db = getDb();
        return db.collection('reviews').find({ userId: new ObjectId(userId) }).toArray();
    }
}

module.exports = Review; 
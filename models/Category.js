// models/Category.js
const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class Category {
    constructor(name, id) {
        this.name = name;
        this._id = id ? new mongodb.ObjectId(id) : null;
    }

    save() {
        const db = getDb();
        if (this._id) {
            return db.collection('categories').updateOne({ _id: this._id }, { $set: this });
        } else {
            return db.collection('categories').insertOne(this);
        }
    }

    static fetchAll() {
        const db = getDb();
        return db.collection('categories').find().toArray();
    }

    static findById(id) {
        const db = getDb();
        return db.collection('categories').findOne({ _id: new mongodb.ObjectId(id) });
    }

    static deleteById(id) {
        const db = getDb();
        return db.collection('categories').deleteOne({ _id: new mongodb.ObjectId(id) });
    }
}

module.exports = Category;

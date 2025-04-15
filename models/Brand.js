// models/brand.js
const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class Brand {
    constructor(id, name, description) {
        this._id = id ? new mongodb.ObjectId(id) : null;
        this.name = name;
        this.description = description;
    }

    save() {
        const db = getDb();
        if (this._id) {
            return db.collection('brands')
                .updateOne({ _id: this._id }, { $set: this });
        } else {
            return db.collection('brands')
                .insertOne(this);
        }
    }

    static fetchAll() {
        const db = getDb();
        return db.collection('brands').find().toArray();
    }

    static findById(id) {
        const db = getDb();
        return db.collection('brands')
            .findOne({ _id: new mongodb.ObjectId(id) });
    }

    static deleteById(id) {
        const db = getDb();
        return db.collection('brands')
            .deleteOne({ _id: new mongodb.ObjectId(id) });
    }
}

module.exports = Brand;

const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class Discount {
  constructor(code, description, value, min_order_value, start_date, end_date, is_active = true, created_at, updated_at, id) {
    this.code = code;
    this.description = description;
    this.value = value;
    this.min_order_value = min_order_value;
    this.start_date = start_date;
    this.end_date = end_date;
    this.is_active = is_active;
    this.created_at = created_at || new Date();
    this.updated_at = updated_at || new Date();
    this._id = id ? new mongodb.ObjectId(id) : null;
  }

  save() {
    const db = getDb();
    let dbOp;
    this.updated_at = new Date();
    if (this._id) {
      dbOp = db
        .collection('discounts')
        .updateOne({ _id: this._id }, { $set: this });
    } else {
      dbOp = db.collection('discounts').insertOne(this);
    }
    return dbOp;
  }

  static findByCode(code) {
    const db = getDb();
    return db
      .collection('discounts')
      .findOne({ code: code });
  }

  static findById(id) {
    const db = getDb();
    return db
      .collection('discounts')
      .findOne({ _id: new mongodb.ObjectId(id) });
  }

  static fetchAll() {
    const db = getDb();
    return db
      .collection('discounts')
      .find()
      .toArray();
  }
}

module.exports = Discount; 
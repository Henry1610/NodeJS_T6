const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class User {
  constructor(email, password, role = 'user', id) {
    this.email = email;
    this.password = password;
    this.role = role; // 'admin' hoặc 'user'
    this._id = id ? new mongodb.ObjectId(id) : null;
  }

  save() {
    const db = getDb();
    let dbOp;
    if (this._id) {
      // Cập nhật người dùng đã tồn tại
      dbOp = db
        .collection('users')
        .updateOne({ _id: this._id }, { $set: this });
    } else {
      // Tạo người dùng mới
      dbOp = db.collection('users').insertOne(this);
    }
    return dbOp;
  }

  static findById(userId) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ _id: new mongodb.ObjectId(userId) })
      .then(user => {
        return user;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static findByEmail(email) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ email: email })
      .then(user => {
        return user;
      })
      .catch(err => {
        console.log(err);
      });
  }
}

module.exports = User; 
const fs = require('fs');
const { get } = require('http');
const path = require('path');
const getDb = require('../util/database').getDb
const p = path.join(path.dirname(process.mainModule.filename), 'data', 'products.json');
const mongodb=require('mongodb')
const getProductsFromFile = (cb) => {
    fs.readFile(p, (err, filecontent) => {
        if (err) {
            cb([]);
        }
        cb(JSON.parse(filecontent));
    })
}

module.exports = class Product {
    constructor(id, title, imgUrl, description, price, category, brand, quantity) {
        this._id = id ? new mongodb.ObjectId(id) : null;
        this.title = title;
        this.category = new mongodb.ObjectId(category);
        this.brand = new mongodb.ObjectId(brand); // Thêm brand (dưới dạng ObjectId)
        this.imgUrl = imgUrl;
        this.description = description;       
        this.quantity = quantity;
        this.price = price;
    }

    save() {
        const db = getDb();
        let dbOp;
        if (this._id) {
            console.log('Update item');
            dbOp = db.collection('products').updateOne({ _id: new mongodb.ObjectId(this._id) }, { $set: this })
        }
        else {
            dbOp = db.collection('products').insertOne(this)
        }
        return dbOp
            .then(result => {
                console.log(result);
            })
            .catch(err => {
                console.log(err);
            });

    }

    static fetchAll(limit = 0) {
        const db = getDb();
        let query = db.collection('products').find();
        
        // Nếu có limit, áp dụng limit
        if (limit > 0) {
            query = query.limit(limit);
        }
        
        return query.toArray()
            .then(products => {
                // Lấy tất cả category và brand để maps ID sang tên
                return Promise.all([
                    db.collection('categories').find().toArray(),
                    db.collection('brands').find().toArray(),
                    Promise.resolve(products)
                ]);
            })
            .then(([categories, brands, products]) => {
                // Map category và brand ID sang tên
                return products.map(product => {
                    const category = categories.find(
                        cat => cat._id.toString() === product.category.toString()
                    );
                    const brand = brands.find(
                        b => b._id.toString() === product.brand.toString()
                    );
                    
                    return {
                        ...product,
                        categoryName: category ? category.name : 'Unknown Category',
                        brandName: brand ? brand.name : 'Unknown Brand'
                    };
                });
            })
            .catch(err => {
                console.log(err);
                return [];
            });
    }

    static findById(id) {
        const db = getDb();
        const objectId=new mongodb.ObjectId(id)
        return db.collection('products').find({_id:objectId}).next()
            .then(products => {
                return products
            })
            .catch((error) => {
                console.log(error);

            })
    }

    static findByCategory(categoryId, limit = 0) {
        const db = getDb();
        let query = db.collection('products').find({
            category: new mongodb.ObjectId(categoryId)
        });
        
        // Nếu có limit, áp dụng limit
        if (limit > 0) {
            query = query.limit(limit);
        }
        
        return query.toArray()
            .then(products => {
                // Lấy tất cả category và brand để maps ID sang tên
                return Promise.all([
                    db.collection('categories').find().toArray(),
                    db.collection('brands').find().toArray(),
                    Promise.resolve(products)
                ]);
            })
            .then(([categories, brands, products]) => {
                // Map category và brand ID sang tên
                return products.map(product => {
                    const category = categories.find(
                        cat => cat._id.toString() === product.category.toString()
                    );
                    const brand = brands.find(
                        b => b._id.toString() === product.brand.toString()
                    );
                    
                    return {
                        ...product,
                        categoryName: category ? category.name : 'Unknown Category',
                        brandName: brand ? brand.name : 'Unknown Brand'
                    };
                });
            })
            .catch(err => {
                console.log(err);
                return [];
            });
    }

    static search(query) {
        const db = getDb();
        return db.collection('products')
            .find({ 
                $or: [
                    { title: { $regex: query, $options: 'i' } }, // Case-insensitive search in title
                    { description: { $regex: query, $options: 'i' } } // Case-insensitive search in description
                ]
            })
            .toArray()
            .then(products => {
                // Lấy tất cả category và brand để maps ID sang tên
                return Promise.all([
                    db.collection('categories').find().toArray(),
                    db.collection('brands').find().toArray(),
                    Promise.resolve(products)
                ]);
            })
            .then(([categories, brands, products]) => {
                // Map category và brand ID sang tên
                return products.map(product => {
                    const category = categories.find(
                        cat => cat._id.toString() === product.category.toString()
                    );
                    const brand = brands.find(
                        b => b._id.toString() === product.brand.toString()
                    );
                    
                    return {
                        ...product,
                        categoryName: category ? category.name : 'Unknown Category',
                        brandName: brand ? brand.name : 'Unknown Brand'
                    };
                });
            })
            .catch(err => {
                console.log(err);
                return [];
            });
    }

    static deleteById(id) {
        // getProductsFromFile(products => {
        //     const product = products.find(prod => prod.id === id);
        //     const updatedProducts = products.filter(prod => prod.id !== id);
        //     fs.writeFile(p, JSON.stringify(updatedProducts), err => {
        //         if (!err) {
        //             Cart.deleteProduct(id, product.price);
        //         }
        //     });
        // });

        const db = getDb();
        return db.collection('products').deleteOne({ _id: new mongodb.ObjectId(id) }).then(result => {
            console.log('Deleted');

        }).catch(err => console.log(err));
    }

}
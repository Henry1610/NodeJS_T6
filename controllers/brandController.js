const Brand = require('../models/brand');

// Lấy danh sách thương hiệu
exports.getBrandList = (req, res) => {
    Brand.fetchAll()
        .then(brands => {
            res.render('pages/brand/brandlist', {
                title: 'Brand List',
                brands
            });
        })
        .catch(err => {
            console.log(err);
            res.render('pages/brand/brandlist', {
                title: 'Brand List',
                brands: []
            });
        });
};

// Hiển thị form thêm thương hiệu
exports.getAddBrand = (req, res) => {
    res.render('pages/brand/addbrand', { title: 'Add Brand' });
};

// Xử lý thêm thương hiệu
exports.postAddBrand = (req, res) => {
    const { name, description } = req.body;
    const brand = new Brand(null, name, description);

    brand.save()
        .then(() => res.redirect('/admin/brandlist'))
        .catch(err => {
            console.error('Error saving brand:', err);
            res.status(500).send('Lỗi khi thêm brand');
        });
};

// Hiển thị form sửa thương hiệu
exports.getEditBrand = (req, res) => {
    Brand.findById(req.params.id)
        .then(brand => {
            if (!brand) return res.redirect('/admin/brandlist');
            res.render('pages/brand/editbrand', {
                title: 'Edit Brand',
                brand
            });
        })
        .catch(err => {
            console.log(err);
            res.redirect('/admin/brandlist');
        });
};

// Xử lý sửa thương hiệu
exports.postEditBrand = (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedBrand = new Brand(id, name, description);

    updatedBrand.save()
        .then(() => res.redirect('/admin/brandlist'))
        .catch(err => {
            console.log(err);
            res.redirect('/admin/brandlist');
        });
};

// Xóa thương hiệu
exports.deleteBrand = (req, res) => {
    Brand.deleteById(req.params.id)
        .then(() => res.redirect('/admin/brandlist'))
        .catch(err => {
            console.log(err);
            res.redirect('/admin/brandlist');
        });
}; 
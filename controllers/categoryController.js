const Category = require('../models/category');

// Lấy danh sách danh mục
exports.getCategoryList = (req, res) => {
    Category.fetchAll()
        .then(categories => {
            res.render('admin/category/categorylist', {
                title: 'Category List',
                categories
            });
        })
        .catch(err => {
            console.log(err);
            res.render('admin/category/categorylist', {
                title: 'Category List',
                categories: []
            });
        });
};

// Hiển thị form thêm danh mục
exports.getAddCategory = (req, res) => {
    res.render('admin/category/addcategory', { title: 'Add Category' });
};

// Xử lý thêm danh mục
exports.postAddCategory = (req, res) => {
    const name = req.body.name;
    const category = new Category(name);
    category.save()
        .then(() => res.redirect('/admin/categorylist'))
        .catch(err => {
            console.error('Error adding category:', err);
            res.status(500).render('admin/category/addcategory', {
                title: 'Add Category',
                error: 'Có lỗi xảy ra khi thêm danh mục. Vui lòng thử lại.'
            });
        });
};

// Hiển thị form sửa danh mục
exports.getEditCategory = (req, res) => {
    Category.findById(req.params.id)
        .then(category => {
            if (!category) return res.redirect('/admin/categorylist');
            res.render('admin/category/editcategory', {
                title: 'Edit Category',
                category
            });
        })
        .catch(err => {
            console.error('Error fetching category:', err);
            res.redirect('/admin/categorylist');
        });
};

// Xử lý sửa danh mục
exports.postEditCategory = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    const updatedCategory = new Category(name, id);
    updatedCategory.save()
        .then(() => res.redirect('/admin/categorylist'))
        .catch(err => {
            console.error('Error updating category:', err);
            res.redirect('/admin/categorylist');
        });
};

// Xóa danh mục
exports.deleteCategory = (req, res) => {
    Category.deleteById(req.params.id)
        .then(() => res.redirect('/admin/categorylist'))
        .catch(err => {
            console.error('Error deleting category:', err);
            res.redirect('/admin/categorylist');
        });
}; 
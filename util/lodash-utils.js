const _ = require('lodash');

/**
 * Nhóm sản phẩm theo danh mục
 * @param {Array} products Danh sách sản phẩm
 * @param {String} field Trường để nhóm (mặc định là 'categoryName')
 * @returns {Object} Sản phẩm được nhóm theo danh mục
 */
exports.groupProductsByField = (products, field = 'categoryName') => {
  return _.groupBy(products, field);
};

/**
 * Lấy top N sản phẩm dựa theo trường
 * @param {Array} products Danh sách sản phẩm
 * @param {String} field Trường để sắp xếp
 * @param {String} order Thứ tự (asc hoặc desc)
 * @param {Number} limit Số lượng sản phẩm cần lấy
 * @returns {Array} Danh sách sản phẩm đã sắp xếp và giới hạn
 */
exports.getTopProducts = (products, field = 'price', order = 'desc', limit = 5) => {
  return _.orderBy(products, [field], [order]).slice(0, limit);
};

/**
 * Lọc sản phẩm theo điều kiện
 * @param {Array} products Danh sách sản phẩm
 * @param {Function} predicate Hàm điều kiện
 * @returns {Array} Danh sách sản phẩm đã lọc
 */
exports.filterProducts = (products, predicate) => {
  return _.filter(products, predicate);
};

/**
 * Tìm kiếm sản phẩm theo từ khóa
 * @param {Array} products Danh sách sản phẩm
 * @param {String} keyword Từ khóa tìm kiếm
 * @param {Array} fields Các trường cần tìm kiếm
 * @returns {Array} Danh sách sản phẩm phù hợp
 */
exports.searchProducts = (products, keyword, fields = ['title', 'description']) => {
  const lowerKeyword = keyword.toLowerCase();
  return _.filter(products, product => {
    return fields.some(field => {
      const value = product[field];
      return value && value.toString().toLowerCase().includes(lowerKeyword);
    });
  });
};

/**
 * Tính tổng giá trị kho
 * @param {Array} products Danh sách sản phẩm
 * @returns {Number} Tổng giá trị
 */
exports.calculateTotalInventoryValue = (products) => {
  return _.sumBy(products, product => Number(product.price));
};

/**
 * Tính tổng giá trị theo danh mục
 * @param {Object} groupedProducts Sản phẩm đã nhóm theo danh mục
 * @returns {Object} Giá trị theo danh mục
 */
exports.calculateValueByCategory = (groupedProducts) => {
  return _.mapValues(groupedProducts, categoryProducts => {
    return _.sumBy(categoryProducts, product => product.price * product.quantity);
  });
};

/**
 * Lấy sản phẩm có số lượng thấp cần nhập thêm
 * @param {Array} products Danh sách sản phẩm
 * @param {Number} threshold Ngưỡng số lượng thấp
 * @returns {Array} Sản phẩm có số lượng thấp
 */
exports.getLowStockProducts = (products, threshold = 10) => {
  return _.filter(products, product => product.quantity < threshold);
};

/**
 * Trích xuất các trường cụ thể từ danh sách sản phẩm
 * @param {Array} products Danh sách sản phẩm
 * @param {Array} fields Các trường cần trích xuất
 * @returns {Array} Danh sách sản phẩm với các trường đã trích xuất
 */
exports.pickProductFields = (products, fields) => {
  return _.map(products, product => _.pick(product, fields));
};

/**
 * Thống kê số lượng sản phẩm theo trường
 * @param {Array} products Danh sách sản phẩm
 * @param {String} field Trường cần thống kê
 * @returns {Object} Kết quả thống kê
 */
exports.countByField = (products, field) => {
  return _.countBy(products, field);
}; 
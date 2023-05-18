const express = require('express');
const router = express.Router();
const admincontroller = require('../controllers/admincontroller')
const upload = require('../utils/multer')
const middlewares = require('../middlewares/middlewares');
const productHelpers = require('../helpers/product-helpers');

/* GET home page. */
router.get('/',admincontroller.adminPage)

router.route('/login')
.get(middlewares.verifyAdminLogin,admincontroller.adminLogin)
.post(admincontroller.adminLoginPost)

router.route('/add-product')
.get(middlewares.verifyAdminLogin,admincontroller.addProduct)
.post(upload.array('image',4), admincontroller.addProductPost)

router.get('/product-list',middlewares.verifyAdminLogin,admincontroller.productList)

router.route('/edit-product/:id')
.get(middlewares.verifyAdminLogin,admincontroller.editProduct)
.post(admincontroller.editProductPost)

router.get('/block-product/:id',middlewares.verifyAdminLogin,admincontroller.blockProduct)

router.get('/unblock-product/:id',middlewares.verifyAdminLogin,admincontroller.unblockProduct)

router.route('/category-list')
.get(middlewares.verifyAdminLogin,admincontroller.categoryList)
.post(admincontroller.postCategory)

router.post('/edit-category/:id',middlewares.verifyAdminLogin,admincontroller.editCategory)

router.get('/list-category/:id',middlewares.verifyAdminLogin,admincontroller.listCategory)

router.get('/unlist-category/:id',middlewares.verifyAdminLogin,admincontroller.unListCategory)

router.get('/logout',admincontroller.adminLogout)

router.get('/user-list',middlewares.verifyAdminLogin,admincontroller.userList)

router.get('/block-user/:id',middlewares.verifyAdminLogin,admincontroller.blockUser)

router.get('/unblock-user/:id',middlewares.verifyAdminLogin,admincontroller.unblockUser)

router.get('/order-details',middlewares.verifyAdminLogin,admincontroller.getOrderDetails)

router.get('/salesreport',middlewares.verifyAdminLogin,admincontroller.getSalesReport)

router.get('/ship-product/:id',middlewares.verifyAdminLogin,admincontroller.shipProduct)

router.get('/deliver-product/:id',middlewares.verifyAdminLogin,admincontroller.deliverProduct)

router.get('/return-product/:id',middlewares.verifyAdminLogin,admincontroller.returnProduct)

router.get('/graph-statics',middlewares.verifyAdminLogin,admincontroller.graphStatics)

router.get('/view-order/:id',middlewares.verifyAdminLogin,admincontroller.orderViewPage)

router.route('/banners')
.get(middlewares.verifyAdminLogin,admincontroller.getBanners)
.post(upload.single('image'),admincontroller.addBanner)

router.get('/unlist-banner/:id',middlewares.verifyAdminLogin,admincontroller.unlistBanner)

router.get('/list-banner/:id',middlewares.verifyAdminLogin,admincontroller.listBanner)

router.route('/coupons')
.get(middlewares.verifyAdminLogin,admincontroller.getCoupons)
.post(admincontroller.addCouponPost)

router.get('/delete-coupon/:id',middlewares.verifyAdminLogin,admincontroller.deleteCoupon)

module.exports = router;
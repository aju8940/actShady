const express = require('express');
const router = express.Router();
const admincontroller = require('../controllers/admincontroller')
const upload = require('../utils/multer')
const middlewares = require('../middlewares/middlewares')

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
.post(admincontroller.addCategoryPost)

// router.route('/edit-category/:id')
// .get(middlewares.verifyAdminLogin,admincontroller)


router.get('/logout',admincontroller.adminLogout)


router.get('/user-list',middlewares.verifyAdminLogin,admincontroller.userList)


router.get('/block-user/:id',middlewares.verifyAdminLogin,admincontroller.blockUser)


router.get('/unblock-user/:id',middlewares.verifyAdminLogin,admincontroller.unblockUser)


module.exports = router;
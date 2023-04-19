const express = require('express');
const router = express.Router();
const usercontroller= require('../controllers/usercontroller')
const middlewares = require('../middlewares/middlewares');
const { route } = require('./admin');

/* GET users listing. */
router.get('/',usercontroller.homepageRender)

router.route('/login')
.get(middlewares.sessionHandle,usercontroller.loginpageRender)
.post(usercontroller.loginPost)

router.route('/signup')
.get(usercontroller.signuppageRender)
.post(middlewares.sessionHandle,usercontroller.signupPost)

router.get('/otplogin',usercontroller.otpLoginRender)

router.post('/send-otp',usercontroller.sendOtp)

router.post('/otp-verify',usercontroller.verifyOtp)

router.get('/logout',usercontroller.logOut)

router.get('/shop',usercontroller.viewProducts)

router.get('/product-details/:id',usercontroller.productDetails)

router.get('/shopping-cart',middlewares.verifyLogin,usercontroller.viewShoppingCart)

router.get('/empty-cart',middlewares.verifyLogin,usercontroller.emptyCart)

router.get('/add-to-cart/:id',middlewares.verifyLogin,usercontroller.addToCArt)

router.post('/change-product-quantity',middlewares.verifyLogin,usercontroller.changeProQuantity)

router.post('/remove-product',middlewares.verifyLogin,usercontroller.removeCartProduct);

router.get('/checkout-page',middlewares.verifyLogin,usercontroller.checkOut)

router.post('/add-address',middlewares.verifyLogin,usercontroller.addAddressPost);

router.post('/place-order',middlewares.verifyLogin,usercontroller.placeOrderPost)

router.get('/orders',middlewares.verifyLogin,usercontroller.getOrders)

router.get('/order-product-detail/:id',middlewares.verifyLogin,usercontroller.getOrderedPro)

router.get('/return-order/:id',middlewares.verifyLogin,usercontroller.returnOrder)

router.get('/cancel-order/:id',middlewares.verifyLogin,usercontroller.cancelOrder)

module.exports = router;

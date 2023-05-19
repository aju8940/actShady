const express = require('express');
const router = express.Router();
const usercontroller= require('../controllers/usercontroller')
const middlewares = require('../middlewares/middlewares');
const { route } = require('./admin');

// HOME PAGE 
router.get('/',usercontroller.homepageRender)

router.post('/search',usercontroller.postSearch)

router.get('/shop',usercontroller.viewProducts)


// USER DETAILS 
router.route('/login')
.get(middlewares.sessionHandle,usercontroller.loginpageRender)
.post(usercontroller.loginPost)

router.route('/signup')
.get(usercontroller.signuppageRender)
.post(middlewares.sessionHandle,usercontroller.signupPost)

router.get('/forgot-password',usercontroller.forgotPassword)

router.route('/change-password')
.get(usercontroller.changePassword)
.post(usercontroller.changePasswordPost)

router.get('/otplogin',usercontroller.otpLoginRender)

router.post('/send-otp',usercontroller.sendOtp)

router.get('/logout',usercontroller.logOut)

router.get('/user-profile',middlewares.verifyLogin,usercontroller.getProfile)

router.get('/edit-user/:id',middlewares.verifyLogin,usercontroller.getEditUser)

router.post('/edit-user/:id',middlewares.verifyLogin,usercontroller.editUserPost)

router.post('/add-new-address',middlewares.verifyLogin,usercontroller.addNewAddress);

router.post('/edit-address/:id',middlewares.verifyLogin,usercontroller.editAddressPost)

router.get('/delete-address/:id',middlewares.verifyLogin,usercontroller.deleteAddress)


//  PRODUCTS && CART DETAILS
router.get('/product-details',usercontroller.productDetails)

router.get('/shopping-cart',middlewares.verifyLogin,usercontroller.viewShoppingCart)

router.get('/add-to-cart/:id',middlewares.verifyLogin,usercontroller.addToCart)

router.post('/change-product-quantity',middlewares.verifyLogin,usercontroller.changeProQuantity)

router.post('/remove-product',middlewares.verifyLogin,usercontroller.removeCartProduct);


// PLACE ORDER && ORDERS 
router.get('/checkout-page',middlewares.verifyLogin,usercontroller.checkOut)

router.post('/add-address',middlewares.verifyLogin,usercontroller.addAddressPost);

router.post('/place-order',middlewares.verifyLogin,usercontroller.placeOrderPost)

router.get('/orders',middlewares.verifyLogin,usercontroller.getOrders)

router.get('/order-product-detail/:id',middlewares.verifyLogin,usercontroller.getOrderedPro)

router.get('/return-order/:id',middlewares.verifyLogin,usercontroller.returnOrder)

router.get('/cancel-order/:id',middlewares.verifyLogin,usercontroller.cancelOrder)

router.post('/verify-payment',middlewares.verifyLogin,usercontroller.razorpayPayment)

router.get('/edit-address/:id',middlewares.verifyLogin,usercontroller.getEditAddress)

router.post('/apply-coupon',middlewares.verifyLogin,usercontroller.applyCoupon)


// WISHLIST DETAILS 
router.get('/wishlist',middlewares.verifyLogin,usercontroller.getWishlist)

router.get('/add-to-wishlist/:id',middlewares.verifyLogin,usercontroller.addToWishlist)

router.get('/remove-wishlist/:id',middlewares.verifyLogin,usercontroller.removeWishlist)


module.exports = router;
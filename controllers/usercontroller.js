const { response, param } = require("../app");
const userHelper = require("../helpers/user-helpers");
const productHelper = require("../helpers/product-helpers");
const session = require("express-session");
const Razorpay = require("razorpay");

module.exports = {
  loginpageRender: (req, res) => {
    try {
      res.render("userview/userlogin", { "logErr": req.session.logErr, layout: "userLoginLayout" });
    } catch (error) {
      console.error(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  loginPost: async (req, res) => {
    try {
      const response = await userHelper.doLogin(req.body);
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.logErr = response.message;
        res.redirect('/login')
      }

    } catch (error) {
      console.error(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  otpLoginRender: (req, res) => {
    try {
      res.render("userview/otp-login", { layout: "userLoginLayout" });
      req.session.otpLoginError = false;
    } catch (error) {
      console.error(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  sendOtp: async (req, res) => {
    try {
      console.log(req.body.phone);
      const user = await userHelper.findUser(req.body.phone);
      console.log(user);
      if (user) {
        req.session.user = user;
        res.json(true);
      } else {
        req.session.user = null;
        req.session.otpLoginError = "Phone Number doest exist";
        res.json(false);
      }
    } catch (error) {
      console.error(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  homepageRender: async (req, res) => {
    try {
      const loggedIn = req.session.user;
      let banner = await userHelper.getBanner()
      if (req.session.user) {
        let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
        let cartCount = await userHelper.getCartCount(req.session.user._id);
        res.render("userview/index", { loggedIn, cartCount, banner, wishlistCount });
      } else {
        res.render("userview/index", { banner });
      }
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  signuppageRender: (req, res) => {
    try {
      res.render("userview/usersignup", { layout: "userLoginLayout", 'logErr': req.session.logErr });
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  signupPost: async (req, res) => {
    try {
      userHelper.doSignup(req.body).then((user) => {
        if (user.status) {
          req.session.user = user;
          req.session.loggedIn = true;
          res.redirect("/");
        } else {
          req.session.logErr = user.message
          res.redirect('/signup')
        }

      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  logOut: (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          res.status(500).send("An error occurred");
        } else {
          res.redirect("/");
        }
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  forgotPassword: (req, res) => {
    try {
      res.render("userview/forgot-password", { layout: "userLoginLayout" });
    } catch (err) {
      console.log(err);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  changePassword: (req, res) => {
    try {
      res.render("userview/change-password", { layout: "userLoginLayout" });
    } catch (err) {
      console.log(err);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  changePasswordPost: (req, res) => {
    try {
      let userId = req.session.user._id;
      console.log(req.session.user);
      userHelper.changePassword(req.body, userId).then(() => {
        req.session.destroy();
        res.redirect("/login");
      });
    } catch (err) {
      console.log(err);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  getProfile: async (req, res) => {
    try {
      let loggedIn = req.session.user;
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      let userAddress = await userHelper.getAllAddress(req.session.user._id);
      let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
      res.render("userview/user-profile", { loggedIn, cartCount, userAddress, wishlistCount });
    } catch (err) {
      console.log(err);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  getEditAddress: async (req, res) => {
    try {
      let loggedIn = req.session.user;
      let user = await userHelper.findUserId(req.session.user._id)
      let userId = user._id
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      let userAddress = await userHelper.getUserAddress(req.session.user._id, req.params.id)
      let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
      res.render("userview/edit-address", { loggedIn, userId, cartCount, userAddress, wishlistCount })
    } catch (error) {
      console.log(error);
      res.render("error", { message: "An error occurred" });
    }
  },

  editAddressPost: (req, res) => {
    try {
      userHelper.editAddress(req.session.user._id, req.body, req.params.id).then(() => {
        res.redirect('/user-profile')
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: "An error occurred" });
    }
  },

  getEditUser: async (req, res) => {
    try {
      let loggedIn = req.session.user
      let user = await userHelper.findUserId(req.session.user._id)
      let userId = user._id
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
      res.render("userview/edit-user", { loggedIn, userId, cartCount, user, wishlistCount })
    } catch (error) {
      console.log(error);
      res.render("error", { message: "An error occurred" });
    }
  },

  editUserPost: (req, res) => {
    try {
      userHelper.editUser(req.session.user._id, req.body).then(() => {
        res.redirect('/user-profile')
      })
    } catch (error) {
      console.log(error);
      res.render("error", { message: "An error occurred" });
    }
  },

  viewProducts: async (req, res) => {
    try {
      let loggedIn = req.session.user;
      let categories = await productHelper.getAllCategory()
      let count = await productHelper.productCount()
      var page = parseInt(req.query.page) || 1;
      var pageSize = parseInt(req.query.pageSize) || 4;
      var skip = (page - 1) * pageSize;
      const totalPages = Math.ceil(count / pageSize);
      const currentPage = page > totalPages ? totalPages : page

      productHelper.getProducts(skip,pageSize).then(async (products) => {
        if (req.session.user) {
          let cartCount = await userHelper.getCartCount(req.session.user._id);
          let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
          res.render("userview/shop", { loggedIn, products, cartCount, categories, wishlistCount, totalPages,currentPage, pageSize });
        } else {
          res.render("userview/shop", { products, categories , pageSize, totalPages, currentPage});
        }
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: "An error occurred" });
    }
  },

  productDetails: (req, res) => {
    try {
      let loggedIn = req.session.user;
      console.log(req.query.id);
      productHelper.getProductDetails(req.query.id).then(async (product) => {
        if (req.session.user) {
          let cartCount = await userHelper.getCartCount(req.session.user._id);
          let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
          res.render("userview/product-details", {
            loggedIn,
            product,
            cartCount,
            wishlistCount
          });
        } else {
          res.render("userview/product-details", { product });
        }
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: "An error occurred" });
    }
  },

  viewShoppingCart: async (req, res) => {
    try {
      let loggedIn = req.session.user;
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      let products = await userHelper.getCartProducts(req.session.user._id);
      let grandTotal = await userHelper.getTotalAmount(req.session.user._id);
      let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
      res.render("userview/shopping-cart", {
        products,
        loggedIn,
        cartCount,
        grandTotal,
        wishlistCount
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: "An error occurred" });
    }
  },

  addToCart: (req, res) => {
    try {
      userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
        res.redirect("/shop");
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: "An error occurred" });
    }
  },

  addToWishlist: (req, res) => {
    try {
      userHelper.addToWishlist(req.params.id, req.session.user._id).then(() => {
        res.redirect('/shop')
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: "An error occurred" });
    }
  },

  changeProQuantity: (req, res) => {
    try {
      userHelper.changeProductQuantity(req.body).then((response) => {
        res.json({
          response,
        });
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  removeCartProduct: (req, res) => {
    try {
      userHelper.removeProductCart(req.body).then((response) => {
        res.json(response);
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  checkOut: async (req, res) => {
    try {
      let loggedIn = req.session.user;
      const userAddress = req.session.user.address
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
      let total = await userHelper.getTotalAmount(req.session.user._id);
      let grandTotal = total[0].total
      let wallet = await userHelper.getWalletAmount(req.session.user._id)
      const products = await userHelper.getCartProducts(req.session.user._id);
      res.render("userview/checkout", {
        loggedIn,
        cartCount,
        userAddress,
        grandTotal,
        products,
        wallet,
        wishlistCount
      });
    } catch (err) {
      console.error(err);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  addAddressPost: (req, res) => {
    try {
      userHelper.updateAddress(req.body, req.session.user._id);
      userHelper.findUserId(req.session.user._id).then((user) => {
        req.session.user = user;
        res.redirect("/checkout-page");
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  addNewAddress: (req, res) => {
    try {
      userHelper.updateAddress(req.body, req.session.user._id);
      userHelper.findUserId(req.session.user._id).then((user) => {
        req.session.user = user;
        res.redirect('/user-profile')
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  deleteAddress: async (req, res) => {
    try {
      let addressId = req.params.id
      let userId = req.session.user._id
      userHelper.deleteAddress(addressId, userId)
      res.redirect('/user-profile')
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  placeOrderPost: async (req, res) => {
    try {
      const address = await userHelper.getUserAddress(
        req.session.user._id,
        req.body.addressId
      );
      let coupon = req.body.coupon
      let payment = req.body.paymentMethod;
      let products = await userHelper.getCartList(req.session.user._id);
      let grandTotal = await userHelper.getTotalAmount(req.session.user._id);
      let total, discount;
      if (coupon) {
        let cpn = await productHelper.getCoupon(coupon)
        discount = parseInt(cpn[0].discount)
        total = grandTotal[0].total - discount
      } else {
        total = grandTotal[0].total
      }
      const orderId = await userHelper.placeOrder(
        address,
        products,
        total,
        payment,
        coupon,
        req.session.user._id,
        discount
      );
      if (req.body["paymentMethod"] == "Cash on delivery") {
        userHelper.decStock(products)
        res.json({ codSuccess: true });
      } else if (req.body["paymentMethod"] == "Wallet") {
        userHelper.decStock(products)
        await userHelper.updateWallet(req.session.user._id, total)
        res.json({ walletPayment: true });
      } else {
        await userHelper.generateRazorpay(orderId, total).then((response) => {
          userHelper.decStock(products)
          res.json(response);
        })

      }
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  getOrders: async (req, res) => {
    try {
      let loggedIn = req.session.user;
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      let orders = await productHelper.getOrderDetails(req.session.user._id);
      let orderCount = await userHelper.getOrderCount(req.session.user._id)
      let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
      let newDate = Date.now()
      res.render("userview/orders", { loggedIn, cartCount, orders, orderCount, wishlistCount, newDate });
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  getOrderedPro: async (req, res) => {
    try {
      let loggedIn = req.session.user;
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      let products = await productHelper.orderProductDetail(req.params.id);
      let order = await productHelper.findOrder(req.params.id);
      let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
      res.render("userview/orderedProduct", {
        loggedIn,
        cartCount,
        products,
        order,
        wishlistCount
      });
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  returnOrder: async (req, res) => {
    try {
      let orderId = req.params.id;
      await productHelper.returnProduct(orderId);
      res.redirect("/orders");
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  cancelOrder: async (req, res) => {
    try {
      let orderId = req.params.id;
      let totalAmount = await userHelper.totalAmount(orderId)
      let userId = req.session.user._id
      let paymentMethod = await userHelper.getPaymentMethod(orderId)
      let orders = await productHelper.findOrder(orderId)
      if (paymentMethod == 'Razorpay' || paymentMethod == 'Wallet') {
        userHelper.toWallet(userId, totalAmount)
        await productHelper.cancelOrder(orderId);
        await userHelper.incStock(orders[0].products)
        res.redirect("/orders");
      } else {
        await productHelper.cancelOrder(orderId);
        await userHelper.incStock(orders[0].products)
        res.redirect("/orders");
      }
    } catch (err) {
      console.log(err);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  razorpayPayment: (req, res) => {
    try {
      console.log(req.body);
      userHelper.verifyPayment(req.body).then(() => {
        userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
          res.json({ status: true })
        })
      }).catch((err) => {
        console.log(err);
        res.json({ status: false })
      })
    } catch (err) {
      console.log(err);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  getWishlist: async (req, res) => {
    try {
      let loggedIn = req.session.user;
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
      let products = await userHelper.getWishlistPro(req.session.user._id)
      res.render('userview/wishlist', { loggedIn, cartCount, products, wishlistCount })
    } catch (err) {
      console.log(err);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  removeWishlist: async (req, res) => {
    try {
      let userId = req.session.user._id
      let proId = req.params.id
      await userHelper.removeWishlistProduct(userId, proId).then(() => {
        res.redirect('/wishlist')
      })
    } catch (error) {
      console.log(err);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  applyCoupon: async (req, res) => {
    try {
      console.log(req.body);
      await productHelper.applyCoupon(req.body.couponCode, req.body.userId).then((response) => {
        if (response.status) {
          let total = req.body.total - response.discount
          res.json({ total, discount: response.discount })
        } else {
          console.log("invalid coupon")
          res.json({ status: false })
        }
      })
    } catch (error) {
      console.log(error);
      res.render("error", { message: 'An Error Occured' })
    }
  },

  postSearch: async (req, res) => {
    var loggedIn = req.session.user
    var searchkey = req.body.search
    var products = await productHelper.findAllSearchProduct(searchkey)
    var categories = await productHelper.getAllCategory()
    if (loggedIn) {
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);

      res.render("userview/search-pro", {
        loggedIn,
        products,
        categories,
        cartCount,
        wishlistCount
      });
    } else {
      res.render("userview/search-pro", {
        loggedIn,
        products,
        categories
      });
    }

  },

}

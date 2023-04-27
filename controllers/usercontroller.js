const { response } = require("../app");
const userHelper = require("../helpers/user-helpers");
const productHelper = require("../helpers/product-helpers");
const session = require("express-session");

module.exports = {
  loginpageRender: (req, res) => {
    res.render("userview/userlogin", { message:false,layout: "userLoginLayout" });
  },

  loginPost: (req, res) => {
    userHelper.doLogin(req.body).then((response) => {
      if (response.status) {
        if (response.unblocked) {
          req.session.loggedIn = true;
          req.session.user = response.user;
          res.redirect("/");
        } else {
          req.session.logErr = "Blocked Account";
          res.render("userview/userlogin",{layout: "userLoginLayout",message:"You are blocked...!!!"});
        }
      } else {
        req.session.logErr = "Invalid email or password";
        res.render("userview/userlogin",{message:"Invalid Email or Password"});
      }
    });
  },

  otpLoginRender: (req, res) => {
    res.render("userview/otp-login", { layout: "userLoginLayout" });
    req.session.otpLoginError = false;
  },

  sendOtp: (req, res) => {
    console.log(req.body.phone);
    userHelper.findUser(req.body.phone).then(async (user) => {
      console.log(user);
      if (user) {
        req.session.user = user;
        res.json(true);
      } else {
        req.session.user = null;
        req.session.otpLoginError = "Phone Number doest exist";
        res.json(false);
      }
    });
  },

  homepageRender: async (req, res) => {
    const loggedIn = req.session.user;
    if (req.session.user) {
      let cartCount = await userHelper.getCartCount(req.session.user._id);
      res.render("userview/index", { loggedIn, cartCount });
    } else {
      res.render("userview/index");
    }
  },

  signuppageRender: (req, res) => {
    res.render("userview/usersignup", { layout: "userLoginLayout" });
  },

  signupPost: (req, res) => {
    userHelper.doSignup(req.body).then((user) => {
      req.session.user = user;
      req.session.loggedIn = true;
      res.redirect("/");
    });
  },

  logOut: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  },

  forgotPassword: (req, res) => {
    res.render("userview/forgot-password", { layout: "userLoginLayout" });
  },

  changePassword: (req, res) => {
    res.render("userview/change-password", { layout: "userLoginLayout" });
  },

  changePasswordPost: (req, res) => {
    let userId = req.session.user._id;
    console.log(req.session.user);
    userHelper.changePassword(req.body, userId).then(() => {
      req.session.destroy();
      res.redirect("/login");
    });
  },

  getProfile: async(req, res) => {
    let loggedIn = req.session.user;
    let cartCount =await userHelper.getCartCount(req.session.user._id);
    let userAddress = req.session.user.address;
    res.render("userview/user-profile",{loggedIn,cartCount,userAddress});
  },

  viewProducts: (req, res) => {
    let loggedIn = req.session.user;
    productHelper.getProducts().then(async (products) => {
      if (req.session.user) {
        let cartCount = await userHelper.getCartCount(req.session.user._id);
        res.render("userview/shop", { loggedIn, products, cartCount });
      } else {
        res.render("userview/shop", { products });
      }
    });
  },

  productDetails: async (req, res) => {
    let loggedIn = req.session.user;

    productHelper.getProductDetails(req.params.id).then(async (product) => {
      if (req.session.user) {
        let cartCount = await userHelper.getCartCount(req.session.user._id);
        res.render("userview/product-details", {
          loggedIn,
          product,
          cartCount,
        });
      } else {
        res.render("userview/product-details", { product });
      }
    });
  },

  viewShoppingCart: async (req, res) => {
    let loggedIn = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    userHelper.getCartProducts(req.session.user._id).then((products) => {
      let grandTotal = 0;
      products.forEach((pro) => {
        pro.subtotal = pro.quantity * pro.product.price;
        grandTotal = grandTotal + pro.subtotal;
      });
      res.render("userview/shopping-cart", {
        products,
        loggedIn,
        cartCount,
        grandTotal,
        
      });
    });
  },

  addToCArt: (req, res) => {
    userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
      res.redirect("/shop");
    });
  },

  addToWishlist: (req,res)=>{
    userHelper.addWishlist(req.params.id,req,session.user._id).then(()=>{
      res.redirect('/shop')
    })
  },

  changeProQuantity: (req, res) => {
    userHelper.changeProductQuantity(req.body).then((response) => {
      res.json({
        response,
      });
    });
  },

  removeCartProduct: (req, res) => {
    userHelper.removeProductCart(req.body).then((response) => {
      res.json(response);
    });
  },

  checkOut: async (req, res) => {
    let loggedIn = req.session.user;
    const userAddress = req.session.user.address;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    userHelper.getCartProducts(req.session.user._id).then((products) => {
      let grandTotal = 0;
      products.forEach((pro) => {
        pro.subtotal = pro.quantity * pro.product.price;
        grandTotal = grandTotal + pro.subtotal;
      });
      res.render("userview/checkout", {
        loggedIn,
        cartCount,
        userAddress,
        grandTotal,
        products,
      });
    });
  },

  addAddressPost: (req, res) => {
    try {
      userHelper.updateAddress(req.body, req.session.user._id);
      userHelper.findUserId(req.session.user._id).then((user) => {
        req.session.user = user;
        res.render("/checkout-page");
      });
    } catch (error) {
      console.log(error);
    }
  },

  addNewAddress: (req,res)=>{
    try {
      userHelper.updateAddress(req.body, req.session.user._id);
      userHelper.findUserId(req.session.user._id).then((user) => {
        req.session.user = user;
        res.redirect('/user-profile')
      });
    } catch (error) {
      console.log(error);
    }
  },

  placeOrderPost: async(req, res) => {
      const address = await userHelper.getUserAddress(req.session.user._id,req.body.addressId);
      let payment = req.body.paymentMethod;
      let products = await userHelper.getCartList(req.session.user._id);
       let grandTotal = await userHelper.getTotalAmount(req.session.user._id);
       console.log(grandTotal);
      userHelper.placeOrder(
          address,
          products,
          grandTotal,
          payment,
          req.session.user._id,
        )
        .then((orderId) => {
          if (req.body["paymentMethod"] == "Cash on delivery") {
            res.json({ codSuccess: true });
          } else {
            userHelper
              .generateRazorpay(orderId, grandTotal)
              .then((response) => {
                res.json(response);
              });
          }
        });
  },

  getOrders: async (req, res) => {
    let loggedIn = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let orders = await productHelper.getOrderDetails(req.session.user._id);
    res.render("userview/orders", { loggedIn, cartCount, orders });
  },

  getOrderedPro: async (req, res) => {
    let loggedIn = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let products = await productHelper.orderProductDetail(req.params.id);
    let order = await productHelper.findOrder(req.params.id);
    res.render("userview/orderedProduct", {
      loggedIn,
      cartCount,
      products,
      order,
    });
  },

  returnOrder: async (req, res) => {
    let orderId = req.params.id;
    await productHelper.returnProduct(orderId).then(() => {
      res.redirect("/orders");
    });
  },

  cancelOrder: async (req, res) => {
    let orderId = req.params.id;
    await productHelper.cancelOrder(orderId).then(() => {
      res.redirect("/orders");
    });
  },

  razorpayPayment: (req, res) => {
    console.log(req.body);
    userHelper.verifyPayment(req.body).then(()=>{
      userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
        res.json({status:true})
      })
    }).catch((err)=>{
      console.log(err);
      res.json({status:false})
    })
  },

  getEditAddress: async(req,res)=>{
    let loggedIn = req.session.user;
    let cartCount =await userHelper.getCartCount(req.session.user._id);
    let userAddress = await userHelper.getUserAddress(req.session.user._id,req.params.id)
    res.render("userview/edit-address",{loggedIn,cartCount,userAddress})
  },

  editAddressPost: (req,res)=>{
    userHelper.editAddress(req.session.user._id,req.body,req.params.id).then(()=>{
      res.redirect('/user-profile')
    })
  },

  getWishlist: async(req,res)=>{
    let loggedIn = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    res.render('userview/wishlist',{loggedIn,cartCount})
  }

}

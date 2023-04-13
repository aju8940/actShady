const { response } = require('../app');
const userHelper = require('../helpers/user-helpers')
const twilio = require('../twilio')
const productHelper = require('../helpers/product-helpers');


module.exports={

loginpageRender:(req,res)=>{
    res.render('userview/userlogin',{layout:'userLoginLayout'})
},

loginPost: (req, res) => {
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      if(response.unblocked){
        req.session.loggedIn = true
        req.session.user = response.user
        res.redirect('/');
      }else{
        req.session.logErr = 'Blocked Account'
        res.redirect('/login')
      }
     
    }else{
      req.session.logErr = 'Invalid email or password'
        res.redirect('/login')
    }
  })
},

otpLoginRender: (req,res)=>{
    res.render('userview/otp-login',{layout:'userLoginLayout'})
    req.session.otpLoginError=false;
},

sendOtp: (req,res)=>{
  req.session.mobile=req.body.phone;
  console.log('asasdddddddsdasdllllllllllllllllllllllllllllllllllllllll');
  userHelper.findUser(req.body.phone).then(async(user)=>{
    console.log(user);
    if(user){
      console.log('ffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      req.session.user = user
      await twilio.sendOtp(req.body.phone)
      res.json(true)
    }else{
      req.session.user = null
      req.session.otpLoginError ='Phone Number doest exist'
      res.json(false)
    }
  })
    
},

verifyOtp : (req, res) =>{
  twilio.verifyOtp(req.session.mobile, req.body.otp).then((result) =>{
    console.log(result);
      if(result === "approved"){
          req.session.loggedIn=true;
          res.json({status : true})                          
      }
      else{               
          res.json({status : false})
      }
  })
},  


homepageRender:async(req,res)=>{
  const loggedIn = req.session.user
  if(req.session.user){
    let cartCount = await userHelper.getCartCount(req.session.user._id)
    res.render('userview/index',{loggedIn,cartCount})
  }else{
    res.render('userview/index')
  }
},

signuppageRender:(req,res)=>{
    res.render('userview/usersignup',{layout:'userLoginLayout'})
},

signupPost:(req,res)=>{
  userHelper.doSignup(req.body).then((user)=>{
    req.session.user = user
    req.session.loggedIn = true
    res.redirect('/');
  })
},

logOut:(req,res)=>{
  req.session.destroy((err)=>{
    if(err){
      console.log(err);
    }else{
      res.redirect('/')
    }
  })
},

viewProducts: (req,res)=>{
  let loggedIn = req.session.user
  productHelper.getProducts().then(async(products)=>{
    if(req.session.user){
      let cartCount = await userHelper.getCartCount(req.session.user._id)
      res.render('userview/shop',{loggedIn,products,cartCount})
    }else{
      res.render('userview/shop',{products})
    }
  })
},

productDetails: async(req,res)=>{
  let loggedIn = req.session.user
 
  productHelper.getProductDetails(req.params.id).then(async(product)=>{
    if(req.session.user){
      let cartCount = await userHelper.getCartCount(req.session.user._id)
      res.render('userview/product-details',{loggedIn,product,cartCount})
    }else{
      res.render('userview/product-details',{product})
    }
  })
},

viewShoppingCart: async(req,res)=>{
  let loggedIn = req.session.user
  let cartCount = await userHelper.getCartCount(req.session.user._id)
  userHelper.getCartProducts(req.session.user._id).then((products)=>{
  console.log(products);
  res.render('userview/shopping-cart',{products,loggedIn,cartCount})
  })
},

addToCArt: (req,res)=>{
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/shop')
  })
},

changeProQuantity: (req,res)=>{
  console.log(req.body);
  userHelper.changeProductQuantity(req.body).then((response)=>{
    res.json(response)
  })
},

removeCartProduct: (req,res)=>{
  console.log(req.body);
  userHelper.removeProductCart(req.body).then(()=>{
    res.json(response)
  })
},

checkOut: (req,res)=>{
  res.render('userview/checkout')
}

}
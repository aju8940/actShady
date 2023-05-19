const { ObjectId } = require('mongodb')
const db = require('../config/connection')
const collection = require('../models/collection')
const bcrypt = require('bcrypt')
const { response, use } = require('../app')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const instance = new Razorpay({
    key_id: 'rzp_test_FN9OHxJLyD7IWz',
    key_secret: 'O70xedTC2mQjy7VCuXXn7lL3',
});



module.exports = {

    doSignup: (userData) => {
        return new Promise(async (res, rej) => {
            let emailExist = await db.get().collection(collection.USER).findOne({ email:userData.email })
            let phoneExist = await db.get().collection(collection.USER).findOne({phone:userData.phone})
            if(emailExist){
                res({status:false,message:'This email is already registered...!!'})
            } else if ( phoneExist ) {
                res({status:false,message:'This mobile number is already registered...!!'})
            }else{
                userData.wallet = 0
                userData.status = true
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER).insertOne(userData)
                res({status:true,userData})
    
            }
         
        })
    },

    changePassword: async (userData, userId) => {
        console.log(userId);
        console.log('userData', userData);
        userData.password = await bcrypt.hash(userData.password, 10)
        db.get().collection(collection.USER).updateOne(
            {
                _id: new ObjectId(userId)
            },
            {
                $set: { password: userData.password }
            }
        )

    },

    doLogin: (userData) => {
        return new Promise(async (res, rej) => {
            let response = {}
            let user = await db.get().collection(collection.USER).findOne({ email: userData.email })
            if (user) {
                if (user.status) {
                    response.unblocked = true
                    bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {
                            console.log('loginsuccess');
                            response.user = user
                            response.status = true
                            res(response)
                        } else {

                            console.log('erorr login');
                            res({ status: false ,message:"Invalid Username Or Password"})
                        }
                    })
                } else {
                    console.log('Blocked User');
                    response.unblocked = false
                    res({ status: false, message:"You Are Blocked...!!" })
                }
            } else {
                console.log('no user available');
                res({ status: false ,message:"No User Available"})

            }

        })

    },
    getAllUsers: () => {
        return new Promise(async (res, rej) => {
            let users = await db.get().collection(collection.USER).find().toArray()
            res(users)
        })
    },

    findAllUser: async (skip, pageSize) => {
        let allUsers = await db.get().collection(collection.USER).find().skip(skip).limit(pageSize).toArray()
        return allUsers
    },

    getUser: async(userId)=>{
        let user = await db.get().collection(collection.USER).find({_id: ObjectId(userId)}).toArray()
        return user
    },

    findUserCount: async () => {
        let countUsers = await db.get().collection(collection.USER).countDocuments()
        return countUsers
    },

    blockUser: (userId) => {
        return new Promise(async (res, rej) => {
            await db.get().collection(collection.USER).updateOne({ _id: new ObjectId(userId) }, { $set: { status: false } })
                .then((status) => {
                    res(status)
                    console.log(status);
                })
        })
    },

    unblockUser: (userId) => {
        return new Promise(async (res, rej) => {
            console.log(userId);
            await db.get().collection(collection.USER).updateOne({ _id: new ObjectId(userId) }, { $set: { status: true } })
                .then((response) => {
                    res(response)
                    console.log(response);
                })
        })
    },

    findUser: async (mobNo) => {
        try {
            const user = await db.get().collection(collection.USER).findOne({ phone: mobNo });
            if (user && user.status) {
                return user;
            } else {
                return false;
            }

        } catch (err) {
            console.log(err);
        }
    },

    addToCart: (proId, userId) => {
        let proObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (res, rej) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                res()
                            })
                } else {
                    await db.get().collection(collection.CART_COLLECTION).updateOne
                        (
                            {
                                user: ObjectId(userId)
                            },
                            {
                                $push: { products: proObj }
                            }
                        ).then((response) => {
                            res()
                        })
                }

            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                await db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    res()
                })
            }
        })
    },

    getCartProducts: async (userId) => {
        return new Promise(async (res, rej) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: ObjectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray()
            res(cartItems)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (res, rej) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            res(count)
        })
    },

    getWishlistCount: (user) => {
        return new Promise(async (res, rej) => {
            let count = 0
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ userId: ObjectId(user) })
           
            if (wishlist) {
                count = wishlist.products.length
            }
            res(count)
        })
    },

    getOrderCount: (userId) => {
        
        return new Promise(async (res, rej) => {
            let count = 0
            let order = await db.get().collection(collection.ORDERS).find({ userId: ObjectId(userId)}).toArray()
         
            if (order) {
                count = order.length
            }
            
            res(count)
            
        })
    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((res, rej) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectId(details.cart) },
                        {
                            $pull: { products: { item: ObjectId(details.product) } }
                        }
                    ).then((response) => {
                        res({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        res(response)
                    })
            }
        })
    },

    removeProductCart: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                }
                )
        })
    },

    updateAddress: (addressData, userId) => {
        return new Promise((res, rej) => {
            addressData._id = new ObjectId()
            db.get().collection(collection.USER).updateOne({ _id: new ObjectId(userId) },
                {
                    $push: {
                        address: addressData
                    }
                }).then((response) => {
                    res(response)
                })
        })
    },

    findUserId: (userId) => {
        return new Promise(async (res, rej) => {
            let user = await db.get().collection(collection.USER).findOne({ _id: new ObjectId(userId) })
            res(user)
        })
    },

    getCartList: (userId) => {
        return new Promise(async (res, rej) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            res(cart.products)
        })
    },

    placeOrder: (order, products, grandTotal, payment, coupon, userId, discount) => {
        return new Promise((res, rej) => {
           
            let orderObj = {
                deliveryAddress: {
                    name: order.name,
                    address: order.housename,
                    city: order.city,
                    district: order.district,
                    pincode: order.pincode,
                    mobile: order.phone
                },
                userId: ObjectId(userId),
                paymentmethod: payment,
                products: products,
                orderstatus: 'placed',
                coupon:discount,
                totalPrice: grandTotal,
                date: Date.now()
            }
            if( coupon ){ 
                db.get().collection(collection.COUPONS).updateOne({ couponCode: coupon },{$pull: {user: ObjectId(userId)}})
                db.get().collection(collection.COUPONS).updateOne({ couponCode: coupon },{$push: {user: ObjectId(userId)}})
            }
           
            db.get().collection(collection.ORDERS).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) })
                res(response.insertedId)
            })

        })
    },

    decStock : async(products)=>{
        for(let i=0;i<products.length;i++){
            await db.get().collection(collection.PRODUCT).updateOne
        ( {
            _id:products[i].item
        },
        {
            $inc:{
                stock:-products[i].quantity
            }
        })
        }
    },

    incStock: async(products)=>{
        for(let i=0;i<products.length;i++){
            await db.get().collection(collection.PRODUCT).updateOne
            (
                {_id:products[i].item},
                {
                    $inc:{
                        stock:products[i].quantity
                    }
                }
            )
        }
    },

    getUserAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            userId = new ObjectId(userId);
            addressId = new ObjectId(addressId);
            const address = await db.get().collection(collection.USER)
                .findOne(
                    {
                        _id: userId,
                        address: { $elemMatch: { _id: addressId } }
                    },
                    {
                        projection: {
                            _id: 0,
                            'address.$': 1
                        }
                    }
                )
                
            resolve(address.address[0]);
        })
    },

    getAllAddress : async(userId)=>{
        let address = await db.get().collection(collection.USER).aggregate(
            [
                {
                    $match:{
                       _id: new ObjectId(userId)
                    }
                },
                {
                    $unwind:{
                        path:'$address'
                    }
                },
                {
                    $project:{
                        _id:0,
                        address:1
                    }
                }
            ]
        ).toArray()
        return address
    },

    editAddress:(userId,addDetails,addressId)=>{
        return new Promise((res,rej)=>{
            db.get().collection(collection.USER).updateOne(
                {
                    _id:ObjectId(userId),
                    address: { $elemMatch: { _id: ObjectId(addressId)  } }
                },
            {
                $set:{
                    'address.$.name': addDetails.name,
                    'address.$.phone':addDetails.phone,
                    'address.$.city':addDetails.city,
                    'address.$.housename':addDetails.housename,
                    'address.$.pincode':addDetails.pincode,
                    'address.$.district':addDetails.district
                }
            }).then((response)=>{
                console.log(response);
                res(response)
            })
        })
    },

    deleteAddress: async(addressId,userId)=>{
        await db.get().collection(collection.USER)
        .updateOne(
            {_id: ObjectId(userId)},
            {$pull:{address:{_id: ObjectId(addressId)}}}
        )
    },

    editUser: async(userId,userData)=>{
        userData.status = true
        userData.password = await bcrypt.hash(userData.password, 10)
        let user = await db.get().collection(collection.USER).updateOne(
            {
                _id:ObjectId(userId)
            },
            {
                $set:{
                    name:userData.name,
                    password:userData.password,
                    phone:userData.phone,
                    email:userData.email
                }
            }
        )
        return user
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },

                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity',{$toInt:'$product.price'}] } }
                    }
                }
            ]).toArray()

            resolve(total)
        })  
    },

    getWalletAmount: async(userId)=>{
        let wallet = await db.get().collection(collection.USER).
        aggregate([
            {
                '$match':{
                    '_id': ObjectId(userId)
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'wallet': 1
                }
            }
        ]).toArray()

        return wallet[0].wallet
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((res, rej) => {
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(order);
                    res(order)

                }
            });
        })

    },

        verifyPayment: (details) => {
        return new Promise(async(res, rej) => {
            const {
                createHmac,
              } = await import('node:crypto');
            let hmac = createHmac('sha256', 'O70xedTC2mQjy7VCuXXn7lL3');

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                res()
            } else {
                res()
            }
        })

    },

    changePaymentStatus: async(orderId)=>{
        let result = await db.get().collection(collection.ORDERS)
        .updateOne(
            {
                _id:ObjectId(orderId)
            },
            {
                $set:{
                    status:'placed'
                }
            })
            return result
    },

    changePaymentStatusFalse: async(orderId)=>{
        let result = await db.get().collection(collection.ORDERS)
        .updateOne(
            {
                _id:ObjectId(orderId)
            },
            {
                $set:{
                    status:'payment failed'
                }
            })
            return result
    },

    totalAmount: async (orderId) => {
        console.log(orderId);
        const total = await db.get().collection(collection.ORDERS)
            .aggregate([
                {
                    '$match': {
                        '_id': ObjectId(orderId)
                    }
                },
                {
                    '$group': {
                        '_id': null,
                        'totalPrice': { $sum: '$totalPrice' } 
                    }
                },
                {
                    '$project': {
                        '_id': 0,
                        'totalPrice': 1
                    }
                }
            ])
            .toArray();
    
        return total[0].totalPrice
    },

    orderUser: async(orderId)=>{
        let user = await db.get().collection(collection.ORDERS)
        .aggregate([
            {
                '$match': {
                    '_id': ObjectId(orderId)
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'userId': 1
                }
            }
        ]).toArray()
        return user[0].userId
    },

    toWallet: async(userId,totalAmount)=>{
        await db.get().collection(collection.USER).updateOne(
            {
                _id:ObjectId(userId)
            },
            {
                $inc:{
                    wallet:totalAmount
                }
            })
    },

    updateWallet: async(userId,totalAmount)=>{
        await db.get().collection(collection.USER).updateOne(
            {
                _id:ObjectId(userId)
            },
            {
                $inc:{
                    wallet:-totalAmount
                }
            })
    },

    getPaymentMethod: async(orderId)=>{
        let payment = await db.get().collection(collection.ORDERS).aggregate([
            {
                '$match': {
                    '_id': ObjectId(orderId)
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'paymentmethod': 1
                }
            }
        ]).toArray()

        return payment[0].paymentmethod
    },

    addToWishlist:( productId, userId)=>{
        return new Promise(async(resolve, reject)=>{
            let proObj = {
                item: ObjectId(productId)
            }
            userId = new ObjectId(userId);
            productId = new ObjectId(productId);
            const isWishList = await db.get().collection(collection.WISHLIST_COLLECTION)
            .findOne({userId: userId, 'products.item': productId});
            if(isWishList){
                resolve({message: "Product already exists in wishlist"})
            }else{
                const wishlist = await db.get().collection(collection.WISHLIST_COLLECTION)
                .findOne({userId: userId});
                if(wishlist){
                    db.get().collection(collection.WISHLIST_COLLECTION)
                    .updateOne(
                        {
                            userId: userId
                        },
                        {
                            $push:{
                                products:proObj 
                            }
                        }                            
                    )
                    .then((response)=>{
                        resolve(response);
                    });
                }else{
                   
                    let wishList={
                        userId : userId,
                        products : [proObj],
                    }
                    db.get().collection(collection.WISHLIST_COLLECTION)
                    .insertOne(wishList)
                    .then((response) => {
                        resolve(response);
                    });
                }               
            }
        })
    
    },

    wishlistCount:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            try{
                const wishlistCount = await db.get().collection(collection.WISHLIST_COLLECTION)
                .find({userId: new ObjectId(userId)}).toArray();
                if(wishlistCount[0].products.length>=1){
                    resolve(wishlistCount[0].products.length);
                }else{
                    resolve(0);
                }
                // console.log(wishlistCount[0].products.length);
            }catch(err){
                resolve(0);
            }
        })
    },

    removeWishlistProduct:(userId, proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION)
            .updateOne(
                {
                    userId: new ObjectId(userId)
                },
                {
                    $pull: { products: { item: ObjectId(proId) } }
                }
            ).then((response) => {
                console.log("remove",response);
                resolve()
            }).catch((err) => {
                console.log(err);
            })
        })
    },

    getWishlistPro: async (user) => {
        return new Promise(async (res, rej) => {
            let wishlistPro = await db.get().collection(collection.WISHLIST_COLLECTION)
                .aggregate([
                    {
                        $match: { userId: ObjectId(user) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray()
            res(wishlistPro)
        })
    },

    getBanner: async()=>{
        let banner = await db.get().collection(collection.BANNERS).find().toArray()
        console.log(banner);
        return banner
    },
} 
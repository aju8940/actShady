const { ObjectId } = require('mongodb')
const db = require('../config/connection')
const collection = require('../models/collection')
const bcrypt = require('bcrypt')
const { response } = require('../app')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const instance = new Razorpay({
    key_id: 'rzp_test_FN9OHxJLyD7IWz',
    key_secret: 'O70xedTC2mQjy7VCuXXn7lL3',
});



module.exports = {

    doSignup: (userData) => {
        return new Promise(async (res, rej) => {
            userData.status = true
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER).insertOne(userData)
            res(userData)

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
                            res({ status: false })
                        }
                    })
                } else {
                    console.log('Blocked User');
                    response.unblocked = false
                    res({ status: true, response })
                }
            } else {
                console.log('no user available');
                res({ status: false })

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

    findUserCount: async () => {
        let countUsers = await db.get().collection(collection.USER).countDocuments()
        return countUsers
    },

    blockUser: (userId) => {
        return new Promise(async (res, rej) => {
            await db.get().collection(collection.USER).updateOne({ _id: new ObjectId(userId) }, { $set: { status: false } })
                .then((response) => {
                    res(response)
                    console.log(response);
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
                console.log(proExist);
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

    placeOrder: (order, products, grandTotal, payment, userId) => {
        return new Promise((res, rej) => {
            let status = order.paymentMethod === 'Cash on delivery' ? 'placed' : 'pending'
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
                status: status,
                orderstatus: 'placed',
                totalPrice: grandTotal,
                date: Date.now()
            }

            db.get().collection(collection.ORDERS).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) })
                res(response.insertedId)
            })

        })
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
                        total: { $sum: { $multiply: ['$quantity','$product.price'] } }
                    }
                }
            ]).toArray()

            resolve(total[0].total)
        })
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
                rej()
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
    }

} 
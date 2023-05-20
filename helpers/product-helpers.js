const db = require('../config/connection')
const collection = require('../models/collection')
const { response } = require('../app');
const { ObjectId, Collection } = require('mongodb');
const adminHelpers = require('./admin-helpers');
// var objectId = require('mongodb').ObjectID

module.exports = {

    addProduct: (productData, callback) => {
        productData.status = true
        productData.stock = parseInt(productData.stock)
        db.get().collection(collection.PRODUCT).insertOne(productData).then((data) => {
            console.log(data);
            callback(data.insertedId)

        })
    },

    addProductImg: (proId, imgUrls) => {
        db.get().collection(collection.PRODUCT).updateOne({ _id: proId },
            {
                $set: { image: imgUrls }
            })
    },

    updateProduct: (proId, proDetails) => {
        return new Promise((res, rej) => {
            console.log('aaaaaaaaaaaaaaaaaaa', proDetails);
            db.get().collection(collection.PRODUCT).updateOne({ _id: ObjectId(proId) },
                {
                    $set: {
                        name: proDetails.name,
                        category: proDetails.category,
                        price: proDetails.price,
                        description: proDetails.description
                    }
                }).then((response) => {
                    console.log(response);
                    res(response)
                })
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT)
                .aggregate([{
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "proDetails"
                    }
                }]).toArray();
            resolve(products);
        })
    },

    getProductDetails: (proId) => {
        console.log(proId);
        return new Promise((res, rej) => {
            db.get().collection(collection.PRODUCT).findOne({ _id: ObjectId(proId) }).then((product) => {
                res(product)
            })
        })
    },

    findAllProducts: async (skip, pageSize) => {
        let allProducts = await db.get().collection(collection.PRODUCT).find().skip(skip).limit(pageSize).toArray()
        return allProducts
    },

    productCount: async () => {
        let countProducts = await db.get().collection(collection.PRODUCT).countDocuments()
        return countProducts
    },

    editCategory: async (newCategory, catId) => {
        await db.get().collection(collection.PRODUCT_CATEGORY).updateOne(
            {
                _id: new ObjectId(catId)
            },
            {
                $set: {
                    category: newCategory.name
                }
            }
        )
    },

    getProducts: () => {
        return new Promise(async (res, rej) => {
            let products = await db.get().collection(collection.PRODUCT).find().toArray()
            res(products)
        })
    },

    addCategory: (name) => {
        return new Promise(async (resolve, reject) => {
            let categoryExit = await db.get().collection(collection.PRODUCT_CATEGORY).findOne({
                category: { $regex: `^${name.category}$`, $options: 'i' }
            });
            if (categoryExit) {
                resolve({ status: false, message: "This category is already exist..!" });
            } else {
                name.status = true
                let cat = await db.get().collection(collection.PRODUCT_CATEGORY).insertOne(name)
                resolve({ status: true, cat });
            }
        })

    },

    getAllCategory: () => {
        return new Promise(async (res, rej) => {
            let category = await db.get().collection(collection.PRODUCT_CATEGORY).find({ status: true }).toArray()
            res(category)
        })
    },

    listCategory: async (catId) => {
        await db.get().collection(collection.PRODUCT_CATEGORY).updateOne(
            {
                _id: new ObjectId(catId)
            },
            {
                $set: {
                    status: true
                }
            }

        )
    },

    unListCategory: async (catId) => {
        await db.get().collection(collection.PRODUCT_CATEGORY).updateOne(
            {
                _id: new ObjectId(catId)
            },
            {
                $set: {
                    status: false
                }
            }

        )
    },

    blockProduct: (proId) => {
        return new Promise(async (res, rej) => {
            await db.get().collection(collection.PRODUCT).updateOne({ _id: new ObjectId(proId) }, { $set: { status: false } })
                .then((response) => {
                    res(response)
                    console.log(response);
                })
        })
    },

    unblockProduct: (proId) => {
        return new Promise(async (res, rej) => {
            console.log(proId);
            await db.get().collection(collection.PRODUCT).updateOne({ _id: new ObjectId(proId) }, { $set: { status: true } })
                .then((response) => {
                    res(response)
                    console.log(response);
                })
        })
    },

    getAllOrders: async () => {
        let orders = await db.get().collection(collection.ORDERS).find().sort({ date: -1 }).toArray();
        return orders;
    },

    getOrderDetails: async (userid) => {
        let order = await db.get().collection(collection.ORDERS).aggregate(
            [
                {
                    $match: {
                        userId: ObjectId(userid)
                    }
                },
                {
                    $sort: { date: -1 }
                }
            ]
        ).toArray()
        return order
    },

    orderProductDetail: async (orderId) => {
        let cartItems = await db.get().collection(collection.ORDERS)
            .aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
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
        return cartItems

    },

    findOrder: async (orderId) => {
        let order = await db.get().collection(collection.ORDERS).find({ _id: new ObjectId(orderId) }).sort({ date: -1 }).toArray()
        return order
    },

    shipproduct: (orderId) => {
        return new Promise(async (res, rej) => {
            await db.get().collection(collection.ORDERS).updateOne({ _id: new ObjectId(orderId) }, { $set: { orderstatus: "shipped" } })
                .then((response) => {
                    res(response)
                })
        })
    },

    deliverProduct: (orderId) => {
        return new Promise(async (resolve, reject) => {
          // Calculate the return expiry date (7 days after the current date)
          let returnExpiryDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // Adding milliseconds for 7 days
          await db.get()
            .collection(collection.ORDERS)
            .updateOne(
              { _id: new ObjectId(orderId) },
              {
                $set: {
                  orderstatus: "delivered",
                  returnExpiry: returnExpiryDate,
                },
              }
            )
            .then((response) => {
              resolve(response);
            })
            .catch((error) => {
              reject(error);
            });
        });
      },

    getOrderDate: async (orderId) => {
        let order = await db.get().collection(collection.ORDERS).findone({ _id: ObjectId(orderId) }).toArray()
        let date = order.date
        console.log(date);
        return date
    },

    returnProduct: (orderId) => {
        return new Promise(async (res, rej) => {
            await db.get().collection(collection.ORDERS).updateOne({ _id: new ObjectId(orderId) }, { $set: { orderstatus: "return pending" } })
                .then((response) => {
                    res(response)
                })
        })
    },

    returnConfirm: (orderId) => {
        return new Promise(async (res, rej) => {
            await db.get().collection(collection.ORDERS).updateOne({ _id: new ObjectId(orderId) }, { $set: { orderstatus: "order returned" } })
                .then((response) => {
                    res(response)
                })
        })
    },

    cancelOrder: (orderId) => {
        return new Promise(async (res, rej) => {
            await db.get().collection(collection.ORDERS).updateOne({ _id: new ObjectId(orderId) }, { $set: { orderstatus: "order cancelled" } })
                .then((response) => {
                    res(response)
                })
        })
    },

    addCoupon: async (data) => {
        let coupons = await db.get().collection(collection.COUPONS).insertOne(data)
        return coupons
    },

    deleteCoupon: async (coupon) => {
        let cp = await db.get().collection(collection.COUPONS).deleteOne({ _id: ObjectId(coupon) })
        return cp
    },

    getAllCoupons: async () => {
        let allCoupons = await db.get().collection(collection.COUPONS).find().toArray()
        return allCoupons
    },

    applyCoupon: (couponCode, userId) => {
        return new Promise(async (resolve, reject) => {
            let checkCoupon = await db.get().collection(collection.COUPONS).find({ couponCode: couponCode }).toArray();
            console.log(checkCoupon);
            if (checkCoupon.length > 0) {
                let today = new Date();
                let expiryDate = new Date(checkCoupon[0].expiryDate);
                let user = await db.get().collection(collection.COUPONS)
                    .aggregate([
                        {
                            $match: { couponCode: couponCode }
                        },
                        {
                            $match: { user: { $in: [ObjectId(userId)] } }
                        }
                    ]).toArray();
                if (user.length == 0) {
                    if (expiryDate >= today) {
                        db.get().collection(collection.COUPONS).updateOne({ couponCode: couponCode }, { $push: { user: ObjectId(userId) } })
                        console.log("date checked-----");
                        let discount = checkCoupon[0].discount;
                        let cpp = { status: true, discount };
                        resolve(cpp);
                    } else {
                        console.log("coupon expired -----");
                        resolve({ status: false });
                    }
                } else {
                    console.log("user found -----");
                    resolve({ status: false });
                }
            } else {
                console.log("invalid code -----");
                resolve({ status: false });
            }
        });
    },

    getCoupon: async (couponCode) => {
        let checkCoupon = await db.get().collection(collection.COUPONS).find({ couponCode: couponCode }).toArray();
        return checkCoupon
    },

    addBanner: async (data) => {
        data.status = true
        let banner = await db.get().collection(collection.BANNERS).insertOne(data)
        return banner
    },

    addBannerImg: (bannerId, img) => {
        db.get().collection(collection.BANNERS).updateOne({ _id: bannerId },
            {
                $set: { image: img }
            })
    },

    getAllBanners: async () => {
        let allBanners = await db.get().collection(collection.BANNERS).find().toArray()
        return allBanners
    },

    listBanner: async (banId) => {
        let list = await db.get().collection(collection.BANNERS).updateOne({ _id: new ObjectId(banId) }, { $set: { status: true } })
        return list
    },

    unlistBanner: async (banId) => {
        let unlist = await db.get().collection(collection.BANNERS).updateOne({ _id: new ObjectId(banId) }, { $set: { status: false } })
        return unlist
    },

    findAllSearchProduct: async (searchkey) => {
        const product = await db.get().collection(collection.PRODUCT).aggregate([
            {
                $match: {
                    $or: [
                        { name: { $regex: searchkey, $options: 'i' } },
                        { category: { $regex: searchkey, $options: 'i' } },
                    ]
                }

            }
        ]).toArray()
        return product


    },

}
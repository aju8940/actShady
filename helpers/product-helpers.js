const db = require('../config/connection')
const collection = require('../models/collection')
const { response } = require('../app');
const { ObjectId }= require('mongodb');
// var objectId = require('mongodb').ObjectID

module.exports={

    addProduct: (productData, callback) => {
        productData.status = true
        db.get().collection(collection.PRODUCT).insertOne(productData).then((data) => {
            console.log(data);
            callback(data.insertedId)

        })
    },

    addProductImg:(proId,imgUrls)=>{
        db.get().collection(collection.PRODUCT).updateOne({_id:proId},
            {
                $set:{image:imgUrls}
            })
    },

    updateProduct:(proId,proDetails)=>{
        return new Promise((res,rej)=>{
            console.log('aaaaaaaaaaaaaaaaaaa',proDetails);
            db.get().collection(collection.PRODUCT).updateOne({_id:ObjectId(proId)},
            {
                $set:{
                    name: proDetails.name,
                    category:proDetails.category,
                    price:proDetails.price,
                    description:proDetails.description
                }
            }).then((response)=>{
                console.log(response);
                res(response)
            })
        })
    },
   
    getAllProducts : () =>{
        return new Promise(async(resolve, reject) =>{
            let products = await db.get().collection(collection.PRODUCT)
            .aggregate([{
                $lookup:{
                    from: "category",
                    localField: "category",
                    foreignField: "_id",
                    as: "proDetails"
                  }
            }]).toArray();
            resolve(products);
        })
    },

    getProductDetails: (proId)=>{
        return new Promise((res,rej)=>{
            db.get().collection(collection.PRODUCT).findOne({_id:ObjectId(proId)}).then((product)=>{
                res(product)
            })
        })
    },

    findAllProducts: async(skip,pageSize)=>{
        let allProducts = await db.get().collection(collection.PRODUCT).find().skip(skip).limit(pageSize).toArray()
        return allProducts
    },

    productCount: async()=>{
        let countProducts = await db.get().collection(collection.PRODUCT).countDocuments()
        return countProducts
    },

    addCategory : (category)=>{
        category.status = true
        return new Promise((res,rej)=>{
            db.get().collection(collection.PRODUCT_CATEGORY).insertOne(category).then((data)=>{
                res(data.insertedId)
            })
        })
        
    },

    editCategory: async(newCategory,catId)=>{
        await db.get().collection(collection.PRODUCT_CATEGORY).updateOne(
            {
                _id:new ObjectId(catId)
            },
            {
                $set:{
                    category:newCategory.name
                }
            }
        )
    },

    getProducts: ()=>{
        return new Promise(async(res,rej)=>{
          let products = await db.get().collection(collection.PRODUCT).find().toArray()
          res(products)
      })
      },

    getAllCategory : ()=>{
        return new Promise(async(res,rej)=>{
            let category = await db.get().collection(collection.PRODUCT_CATEGORY).find().toArray()
            res(category)
        })
    },

    listCategory: async(catId)=>{
        await db.get().collection(collection.PRODUCT_CATEGORY).updateOne(
            {
                _id:new ObjectId(catId)
            },
            {
                $set:{
                    status:true
                }
            }

        )
    },

    unListCategory: async(catId)=>{
        await db.get().collection(collection.PRODUCT_CATEGORY).updateOne(
            {
                _id:new ObjectId(catId)
            },
            {
                $set:{
                    status:false
                }
            }

        )
    },

    blockProduct: (proId)=>{
        return new Promise(async(res,rej)=>{
            await db.get().collection(collection.PRODUCT).updateOne({_id:new ObjectId(proId)},{$set:{status:false}})
            .then((response)=>{
                res(response)
                console.log(response);
            })
        })
    },

    unblockProduct: (proId)=>{
        return new Promise(async(res,rej)=>{
            console.log(proId);
            await db.get().collection(collection.PRODUCT).updateOne({_id:new ObjectId(proId)},{$set:{status:true}})
            .then((response)=>{
                res(response)
                console.log(response);
            })
        })
    },

    getAllOrders: async()=>{
        let orders = await db.get().collection(collection.ORDERS).find().toArray()
        return orders
    },

    getOrderDetails: async(userid)=>{
        let order = await db.get().collection(collection.ORDERS).aggregate(
            [
                {
                    $match:{userId:ObjectId(userid)
                    }
                }
            ]
            ).toArray()
        return order
    },

    orderProductDetail: async (orderId)=>{
            let cartItems = await db.get().collection(collection.ORDERS)
            .aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            return cartItems
        
      },

      findOrder: async(orderId)=>{
        let order = await db.get().collection(collection.ORDERS).find({_id:new ObjectId(orderId)}).toArray()
        return order
      },

    shipproduct: (orderId)=>{
        return new Promise(async(res,rej)=>{
            await db.get().collection(collection.ORDERS).updateOne({_id:new ObjectId(orderId)},{$set:{orderstatus:"shipped"}})
            .then((response)=>{
                res(response)
            })
        })
    },

    deliverProduct: (orderId)=>{
        return new Promise(async(res,rej)=>{
            await db.get().collection(collection.ORDERS).updateOne({_id:new ObjectId(orderId)},{$set:{orderstatus:"delivered"}})
            .then((response)=>{
                res(response)
            })
        })
    },

    returnProduct: (orderId)=>{
        return new Promise(async(res,rej)=>{
            await db.get().collection(collection.ORDERS).updateOne({_id:new ObjectId(orderId)},{$set:{orderstatus:"return pending"}})
            .then((response)=>{
                res(response)
            })
        })
    },

    returnConfirm: (orderId)=>{
        return new Promise(async(res,rej)=>{
            await db.get().collection(collection.ORDERS).updateOne({_id:new ObjectId(orderId)},{$set:{orderstatus:"order returned"}})
            .then((response)=>{
                res(response)
            })
        })
    },

    cancelOrder: (orderId)=>{
        return new Promise(async(res,rej)=>{
            await db.get().collection(collection.ORDERS).updateOne({_id:new ObjectId(orderId)},{$set:{orderstatus:"order cancelled"}})
            .then((response)=>{
                res(response)
            })
        })
    }
    
}
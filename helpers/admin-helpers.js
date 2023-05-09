const collection = require('../models/collection')
const bcrypt = require('bcrypt')
const db = require('../config/connection')


module.exports={

    adminLogin:(admindata)=>{
        return new Promise(async (res,rej)=>{
            let response={}
            let admin = await db.get().collection(collection.ADMIN_LOGIN).findOne({email:admindata.email})
            if(admin){
                bcrypt.compare(admindata.password,admin.password).then((status)=>{
                    if(status){

                        console.log('admin login successfull');
                        response.admin=admin
                        response.status=true
                        res(response)
                    }
                    else{
                        console.log('admin login error');
                        res({status:false})
                    }
                })
            }else{
                console.log('no admin available');
                res({status:false})
            }
        })
    },

    getOrderStatistics: () => {
        return new Promise(async (resolve, reject) => {
            let orderStatistics = await db.get().collection(collection.ORDERS).aggregate([
                {
                    $group: {
                        _id: "$orderstatus",
                        count: { $sum: 1 },
                    }

                }

            ]).toArray()
            resolve(orderStatistics)

        })


    }
    , getSaleStatistics: () => {
       
        return new Promise(async (resolve, reject) => {
            let saleStatistics = await db.get().collection(collection.ORDERS).aggregate([
                { $match: { totalPrice: { $exists: true } } },
                {
                    $group: {
                        _id: { $month:{$toDate: "$date" }}, // Group by month of the "date" field
                        totalAmount: { $sum: "$totalPrice" } // Calculate the sum of the "amount" field
                    }
                }, { $sort: { date: 1 } },

            ]).toArray()
            resolve(saleStatistics)

        })


    },

    totalAmount: async()=>{
        let total = await db.get().collection(collection.ORDERS).aggregate([
            {
                $group: {
                    _id:null,
                    totalAmount: { $sum: "$totalPrice" } // Calculate the sum of the "amount" field
                }
            },
            {
                $project: {
                    _id:0,
                    "total" : '$totalAmount'
                }
            }

        ]).toArray()
        return total
    },

    isCategoryExist: async (name) => {
        let category = await db.get().collection(collection.PRODUCT_CATEGORY).findOne({ category: name });
        if (category) {
          console.log('Category Already Exists:', category);
          return true;
        } else {
          console.log('Category does not exist');
          return false;
        }
      }
    
}
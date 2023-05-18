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
                        res({status:false, message:"Invalid Email Or Password"})
                    }
                })
            }else{
                console.log('no admin available');
                res({status:false , message:"Invalid Email Or Password"})
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

    totalRev: async () => {
        let total = await db.get().collection(collection.ORDERS).aggregate([
          {
            $match: {
              orderstatus: "delivered"
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$totalPrice" }
            }
          },
          {
            $project: {
              _id: 0,
              total: "$totalAmount"
            }
          }
        ]).toArray();
        console.log(total);
        return total
      },

    
    
}
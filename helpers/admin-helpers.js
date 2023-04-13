const collection = require('../models/collection')
const bcrypt = require('bcrypt')
const db = require('../config/connection')


module.exports={

    adminLogin:(admindata)=>{
        return new Promise(async (res,rej)=>{
            let response={}
            let admin = await db.get().collection(collection.ADMIN_LOGIN).findOne({email:admindata.email})
            if(admin){
                console.log(admin.password,'===================================');
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
    }
}
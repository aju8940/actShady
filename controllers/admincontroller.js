const productHelpers = require('../helpers/product-helpers')
const session = require('express-session')
const adminHelpers = require('../helpers/admin-helpers')
const userHelpers = require('../helpers/user-helpers')
const { response } = require('../app');
const cloudinary= require('../utils/cloudinary')
const upload= require('../utils/multer')
const path = require('path');
const { log } = require('console');
const { ObjectId } = require('mongodb');


module.exports={

    adminPage:(req,res)=>{
        let admin = req.session.admin
        if(req.session.admin){
            res.render('adminview/index',{layout:"adminlayout"})
        }else{
            res.render('adminview/adminlogin',{layout:"adLoginLayout"})
        }
    },

    adminLogin:(req, res) => {
        res.render('adminview/adminlogin',{layout:"adLoginLayout"})
    },

    adminLoginPost:(req,res)=>{
        adminHelpers.adminLogin(req.body).then((response)=>{
            if(response.status){
                req.session.admin = true
                req.session.admin = response.admin
                res.redirect('/admin')
            }else{
                res.redirect('/admin')

            }
        })
    },
    
    adminLogout:(req,res)=>{
        req.session.destroy((err)=>{
            if(err){
                console.log(err);
            }else{
                res.redirect('/admin')
            }
        })
    },

    addCategoryPost: (req,res)=>{
            productHelpers.addCategory(req.body).then(()=>{
                res.redirect('/admin/category-list')
            })
    },

    categoryList:(req,res)=>{
        productHelpers.getAllCategory().then((category)=>{
            res.render('adminview/category-list',{category,layout:'adminLayout'})
        })
            
    },

    editCategory: (req,res)=>{
        console.log(req.params.id);
        console.log(req.body);
        productHelpers.editCategory(req.body,req.params.id).then(()=>{
            res.redirect('/admin/category-list')
        })
    },

    listCategory: (req,res)=>{
        productHelpers.listCategory(req.params.id).then(()=>{
            res.redirect('/admin/category-list')
        })
    },

    unListCategory: (req,res)=>{
        productHelpers.unListCategory(req.params.id).then(()=>{
            res.redirect('/admin/category-list')
        })
    },

    addProduct:(req,res)=>{
            productHelpers.getAllCategory().then((category)=>{
                res.render('adminview/addproduct',{category,layout:"adminlayout"})
            })
    },

    addProductPost: async (req, res) => {
        // console.log(req.body);
        try {
            
            console.log(req.files)
            
            const imgUrl = [];
            for (let i = 0; i < req.files.length; i++) {
                const result = await cloudinary.uploader.upload(req.files[i].path);
                imgUrl.push(result.url);
                
                console.log(result.url);
                
            }
            productHelpers.addProduct(req.body, async (id) => {
                productHelpers.addProductImg(id, imgUrl)
            })
        } catch (err) {
            console.log(err);
        } finally {
            // req.session.submitStatus = "product Added"
            res.redirect('/admin/add-product');
        }
    },

    editProduct: (req,res)=>{
            productHelpers.getProductDetails(req.params.id).then((product)=>{
            res.render('adminview/edit-product',{product,layout:"adminlayout"})
            })
    },

    editProductPost:(req,res)=>{
        console.log("0qqqqqqqqq000000000000000000000000000");
        console.log(req.body);
        productHelpers.updateProduct(req.params.id,req.body).then(()=>{
            res.redirect('/admin/product-list')
        })
    },

    productList: async (req,res)=>{
            // productHelpers.getAllProducts().then((products)=>{
            //     res.render('adminview/product-list',{products,layout:'adminLayout'})
            // })

            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 5;
            const skip = (page - 1) * pageSize;

             const products = await productHelpers.findAllProducts(skip,pageSize)    
            
             const count = await productHelpers.productCount()   

            const totalPages = Math.ceil(count / pageSize);
            const currentPage = page > totalPages ? totalPages : page;
            res.render('adminview/product-list',{products,layout:'adminLayout',totalPages,currentPage,pageSize})
    },

    userList: async(req,res)=>{
            // userHelpers.getAllUsers().then((users)=>{
            //     res.render('adminview/userlist',{users ,layout:'adminLayout'})
            // })

            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 5;
            const skip = (page - 1) * pageSize;

             const users = await userHelpers.findAllUser(skip,pageSize)    
             const count = await userHelpers.findUserCount()   

            const totalPages = Math.ceil(count / pageSize);
            const currentPage = page > totalPages ? totalPages : page;
         
            res.render('adminview/userlist',{users ,layout:'adminLayout', totalPages,currentPage,pageSize})
    },

    blockUser: async (req, res) => {
        console.log('fffffffffffffffffffffffffffffffffff');
        let userId = req.params.id;
            await userHelpers.blockUser(userId).then(()=>{
                res.redirect("/admin/user-list");
            })
    },

    unblockUser: async (req, res) => {
        let userId = req.params.id;
            await userHelpers.unblockUser(userId).then(()=>{
                res.redirect("/admin/user-list");
            })
    },

    blockProduct: async (req, res) => {
        let proId = req.params.id;
            await productHelpers.blockProduct(proId).then(()=>{
                res.redirect("/admin/product-list");
            })
    },

    unblockProduct: async (req, res) => {
        let proId = req.params.id;
            await productHelpers.unblockProduct(proId).then(()=>{
                res.redirect("/admin/product-list");
            })
    },

    getOrderDetails: async(req,res)=>{
        await productHelpers.getAllOrders().then((orders)=>{
            res.render('adminview/order-details',{layout:"adminlayout",orders})
        })
        
    },

    shipProduct: async(req,res)=>{
        let orderId = req.params.id
        console.log(orderId);
        await productHelpers.shipproduct(orderId).then(()=>{
            res.redirect('/admin/order-details')
        })
    },

    deliverProduct: async(req,res)=>{
        let orderId = req.params.id
        await productHelpers.deliverProduct(orderId).then(()=>{
            res.redirect('/admin/order-details')
        })
    },

    returnProduct: async(req,res)=>{
        let orderId = req.params.id
        await productHelpers.returnConfirm(orderId).then(()=>{
            res.redirect('/admin/order-details')
        })
    }
      
}
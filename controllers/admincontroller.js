const productHelpers = require('../helpers/product-helpers')
const session = require('express-session')
const adminHelpers = require('../helpers/admin-helpers')
const userHelpers = require('../helpers/user-helpers')
const { response } = require('../app');
const cloudinary = require('../utils/cloudinary')
const upload = require('../utils/multer')
const path = require('path');
const { log } = require('console');
const { ObjectId } = require('mongodb');


module.exports = {

    adminPage: async (req, res) => {
        try {
            if (req.session.admin) {
                let order = await productHelpers.getAllOrders()
                let orderCount = order.length ?? 0
                let totalA = await adminHelpers.totalRev()
                let total = totalA[0]?.total ?? 0
                let products = await productHelpers.productCount() ?? 0
                res.render('adminview/index', { orderCount, products, total, layout: "adminlayout" })
            } else {
                res.render('adminview/adminlogin', { layout: "adLoginLayout" })
            }
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    adminLogin: (req, res) => {
        try {
            res.render('adminview/adminlogin', { layout: "adLoginLayout" })
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }

    },

    adminLoginPost: async (req, res) => {
        try {
            let response = await adminHelpers.adminLogin(req.body)
            if (response.status) {
                req.session.admin = true
                req.session.admin = response.admin
                res.redirect('/admin')
            } else {
                errMsg = response.message
                res.redirect('/admin')
            }

        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    adminLogout: (req, res) => {
        try {
            req.session.destroy((err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/admin')
                }
            })
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    postCategory: async (req, res) => {
        try {
            productHelpers.addCategory(req.body).then((response) => {
                if (response.status) {
                    res.json({failed:false})
                } else {
                    res.json({failed:true})
                }
            })
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }

    },

    categoryList: async(req, res) => {
        try {
            let category = await productHelpers.getAllCategory()
                res.render('adminview/category-list', { category, layout: 'adminLayout' })
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    editCategory: async (req, res) => {
        try {
            await productHelpers.editCategory(req.body, req.params.id);
            res.redirect('/admin/category-list');
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    listCategory: async (req, res) => {
        try {
            await productHelpers.listCategory(req.params.id);
            res.redirect('/admin/category-list');
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    unListCategory: async (req, res) => {
        try {
            await productHelpers.unListCategory(req.params.id);
            res.redirect('/admin/category-list');
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    unlistBanner: async (req, res) => {
        try {
            await productHelpers.unlistBanner(req.params.id)
            res.redirect('/admin/banners')
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    listBanner: async (req, res) => {
        try {
            await productHelpers.listBanner(req.params.id)
            res.redirect('/admin/banners')
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    addProduct: async (req, res) => {
        try {
            const category = await productHelpers.getAllCategory();
            res.render('adminview/addproduct', { category, layout: 'adminlayout' });
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    addProductPost: async (req, res) => {
        try {

            const imgUrl = [];
            for (let i = 0; i < req.files.length; i++) {
                const result = await cloudinary.uploader.upload(req.files[i].path);
                imgUrl.push(result.url);

            }
            productHelpers.addProduct(req.body, async (id) => {
                productHelpers.addProductImg(id, imgUrl);
            });
            res.redirect('/admin/add-product');
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    editProduct: async (req, res) => {
        try {
            const product = await productHelpers.getProductDetails(req.params.id);
            res.render('adminview/edit-product', { product, layout: 'adminlayout' });
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    editProductPost: async (req, res) => {
        try {
            await productHelpers.updateProduct(req.params.id, req.body);
            res.redirect('/admin/product-list');
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    productList: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 5;
            const skip = (page - 1) * pageSize;

            const products = await productHelpers.findAllProducts(skip, pageSize)

            const count = await productHelpers.productCount()

            const totalPages = Math.ceil(count / pageSize);
            const currentPage = page > totalPages ? totalPages : page;

            res.render('adminview/product-list', {
                products,
                layout: 'adminLayout',
                totalPages,
                currentPage,
                pageSize
            });
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    userList: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 5;
            const skip = (page - 1) * pageSize;

            const users = await userHelpers.findAllUser(skip, pageSize);
            const count = await userHelpers.findUserCount();

            const totalPages = Math.ceil(count / pageSize);
            const currentPage = page > totalPages ? totalPages : page;

            res.render('adminview/userlist', {
                users,
                layout: 'adminLayout',
                totalPages,
                currentPage,
                pageSize
            });
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    blockUser: async (req, res) => {
        try {
            let userId = req.params.id;

            await userHelpers.blockUser(userId);
            res.redirect('/admin/user-list');
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    unblockUser: async (req, res) => {
        try {
            let userId = req.params.id;

            await userHelpers.unblockUser(userId);
            res.redirect('/admin/user-list');
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    blockProduct: async (req, res) => {
        try {
            let proId = req.params.id;

            await productHelpers.blockProduct(proId);
            res.redirect('/admin/product-list');
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    unblockProduct: async (req, res) => {
        try {
            let proId = req.params.id;

            await productHelpers.unblockProduct(proId);
            res.redirect('/admin/product-list');
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    getOrderDetails: async (req, res) => {
        try {
            const orders = await productHelpers.getAllOrders();
            res.render('adminview/order-details', { layout: 'adminlayout', orders });
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    getSalesReport: async (req, res) => {
        try {
            await productHelpers.getAllOrders().then((orders) => {
                res.render('adminview/sales-report', { layout: "adminlayout", orders })
            })
        } catch (err) {
            console.log(err);
            res.render("error", { message: 'An Error Occured' })
        }

    },

    orderViewPage: async (req, res) => {
        try {
            await productHelpers.findOrder(req.params.id).then(async (order) => {
                let products = await productHelpers.orderProductDetail(req.params.id);
                let totalPrice = order[0].totalPrice
                let user = await userHelpers.getUser(order[0].userId)
                res.render('adminview/view-order-details', { layout: "adminlayout", order, user, products, totalPrice })
            })
        } catch (err) {
            console.log(err);
            res.render("error", { message: 'An Error Occured' })
        }

    },

    shipProduct: async (req, res) => {
        try {
            let orderId = req.params.id
            await productHelpers.shipproduct(orderId).then(() => {
                res.redirect('/admin/order-details')
            })
        } catch (err) {
            console.log(err);
            res.render("error", { message: 'An Error Occured' })
        }

    },

    deliverProduct: async (req, res) => {
        try {
            let orderId = req.params.id
            await productHelpers.deliverProduct(orderId).then(() => {
                res.redirect('/admin/order-details')
            })
        } catch (err) {
            console.log(err);
            res.render("error", { message: 'An Error Occured' })
        }

    },

    returnProduct: async (req, res) => {
        try {
            let orderId = req.params.id
            let totalAmount = await userHelpers.totalAmount(orderId)
            let userId = await userHelpers.orderUser(orderId)
            let orders = await productHelpers.findOrder(orderId)
            await productHelpers.returnConfirm(orderId).then(() => {
                userHelpers.incStock(orders[0].products)
                userHelpers.toWallet(userId, totalAmount).then(() => {
                    res.redirect('/admin/order-details')
                })
            })
        } catch (err) {
            console.log(err);
            res.render("error", { message: 'An Error Occured' })
        }

    },

    graphStatics: async (req, res) => {
        try {
            let OrderStatistics = await adminHelpers.getOrderStatistics()
            let saleStatistics = await adminHelpers.getSaleStatistics()
            res.json({ OrderStatistics, saleStatistics })
        } catch (err) {
            console.log(err);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    getCoupons: (req, res) => {
        try {
            productHelpers.getAllCoupons().then((coupons) => {
                console.log(coupons);
                res.render('adminview/coupons', { layout: "adminlayout", coupons })
            })
        } catch (err) {
            console.log(err);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    addCouponPost: async (req, res) => {
        try {
            console.log(req.body);
            await productHelpers.addCoupon(req.body).then(() => {
                res.redirect('/admin/coupons')
            })
        } catch (err) {
            console.log(err);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    deleteCoupon: (req, res) => {
        try {
            console.log(req.params.id, 'iiiiiiiiiiiiiiiiddddddddddddddddddddddddddd');
            let couponId = req.params.id
            productHelpers.deleteCoupon(couponId).then(() => {
                res.redirect('/admin/coupons')
            })
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    getBanners: async (req, res) => {
        try {
            let banner = await productHelpers.getAllBanners()
            console.log(banner);
            res.render('adminview/banners', { banner, layout: "adminlayout" })
        } catch (err) {
            console.log(err);
            res.render("error", { message: 'An Error Occured' })
        }
    },

    addBanner: async (req, res) => {
        try {
            const result = await cloudinary.uploader.upload(req.file.path);
            await productHelpers.addBanner(req.body).then(async (banner) => {
                let id = banner.insertedId
                let img = result.url
                await productHelpers.addBannerImg(id, img)
            })
            res.redirect('/admin/banners')
        } catch (error) {
            console.log(error);
            res.render("error", { message: 'An Error Occured' })
        }
    },

}
module.exports={

    verifyLogin:(req,res,next)=>{
        let loggedIn = req.session.loggedIn
        if(req.session.loggedIn == true){
            next()
        }else{
            res.redirect('/login')
         }
    },

    verifyAdminLogin:(req,res,next)=>{
        if(req.session.admin){
            next()
        }else{
            res.redirect('/admin')
         }
    },

    sessionHandle:(req,res,next)=>{
        if(req.session.user){
            res.redirect('/')
        }else{
            next()
        }
    },

}
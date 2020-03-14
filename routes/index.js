var express = require('express');
var router = express.Router();
const controller=require('../controller/userController')
const userSchema = require('../model/user');
/* GET Route */
router.get('/',controller.checkAuth,function(req,res){
  let id=req.id;
  userSchema.findById({'_id':id},(err,data)=>{
    if(err){

    }
    else{
      console.log(data);
      let pro=data.profilepic;
      let name=data.name;
      msg=""
      res.render('index.html',{msg,pro,name});
    }
  })
  
});

router.get('/not',controller.checkAuth, (req, res) => {
  userSchema.findById({'_id':id},(err,data)=>{
    if(err){

    }
    else{
      console.log(data);
      let pro=data.profilepic;
      let name=data.name;
      msg="Not Authorized"
      res.render('index.html',{msg,pro,name});
    }
  })

});


router.get('/adduser',controller.checkAuth,function(req,res){
  msg=""
  res.render('register.html',{msg});
});

router.get('/addsubadmin',controller.checkAuth,controller.checkType,function(req,res){
  res.render('subadminregister.html');
});

router.post('/registeruser',controller.checkAuth,controller.register);

router.post('/registersubadmin',controller.checkAuth,controller.checkType,controller.registersubadmin);

router.post('/login',controller.login);

router.post('/update',controller.checkAuth,controller.checkType,controller.modify);

router.get('/viewuser',controller.checkAuth,controller.getUser);

router.get('/viewsubadmin',controller.checkAuth,controller.checkType,controller.getSubadmin);

router.get('/delete/:id',controller.checkAuth,controller.checkType,controller.del)

router.get('/modify/:id',controller.checkAuth,controller.checkType,controller.mod)

router.get('/changepass/:id',controller.checkAuth,controller.checkType,controller.changepass)

router.get('/logout',(req,res)=>{
  res.clearCookie('name').redirect('/');
})

router.get('/forgetpassword',(req,res)=>{
  res.render('forgot-password.html');
})


router.get('/adminchange', controller.checkAuth,controller.checkType,(req, res) => {
  
  res.render('changepass.html');

});

router.get('/upload', controller.checkAuth,controller.checkType,(req, res) => {
  
  res.render('upload.html');

});


router.post('/uploadpic',controller.checkAuth,controller.checkType,controller.fileupload)

router.post('/adminchangepass',controller.checkAuth,controller.checkType,controller.adminpass);

router.post('/resetsapass',controller.checkreset,controller.decryppass,controller.resetsapass);

router.post('/resetpass',controller.resetpass);

router.get('/recover/:id',controller.check2Auth,controller.changelinkpass);

router.post('/linkpass',controller.respass);
module.exports = router;

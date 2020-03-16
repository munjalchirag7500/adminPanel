module.exports = {
    register, resetpass, resetsapass, decryppass, checkreset, adminpass,
    login, checkAuth, changepass, registersubadmin, eMail, getUser, del,
    getSubadmin, checkType, mod, modify, changelinkpass, check2Auth, respass, fileupload
}
const bcrypt = require('bcrypt');
SALT_WORK_FACTOR = 10;
const key = require('../key')
const userSchema = require('../model/user');
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer");
var generator = require('generate-password');
var a = require('js-alert');
const formidable = require('formidable');
var path = require('path');
const cloudinary = require('cloudinary')

var msg = ""



let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'munjal.chirag.test@gmail.com',
        pass: '7500598665'
    }
});

function check2Auth(req, res, next) {
    let id = req.params.id || undefined;
    if(id == undefined){
        res.send("All Field Required");
    }
    else{
    console.log(id);
    jwt.verify(id, key.secret, function (err, decode) {
        if (err) {
            res.redirect('/');
            a.alert("PPPPPP")
        }
        else {
            let role = decode.role;
            if (role == "resetpass") {
                req.id = decode.id;
                next();

            }
            else {
                
                res.send("Invalid Token");
            }
        }
    })}
}



function respass(req, res) {

    let token = req.body.link || undefined;
    let id = req.body.id || undefined;
    let pass = req.body.password || undefined;
    if ((token == undefined )  || (id == undefined ) || (pass == undefined)){
        res.send("All Field Required");
    }
    else{
    userSchema.findOne({ '_id': id, 'passwordreset': token }).exec((err, data) => {
        if (err) {
            console.log(err)
        }
        else if (data == null) {
            res.send("Link Expired");
            a.alert("Link Expired")
        }
        else {
            data.passwordreset = undefined;
            data.password = pass;
            data.save(function (err, result) {
                if (err) {
                    console.log(err);
                }
                else {
                    res.redirect('/');
                    a.alert("Password Changed")
                }
            })
        }
    })}
}



function adminpass(req, res) {
    let id = req.id || undefined;
    let pass = req.body.pass || undefined;
    let npass = req.body.newpass || undefined;
    let pro=data.profilepic;
    let name=data.name;
    if((id == undefined) || (pass == undefined) || (npass == undefined)){
        res.send("All Field Required");
    }


    else{
    userSchema.findById({ '_id': id }, function (err, data) {
        if (err) {
            console.log(err);

        }
        else {
            data.comparePassword(pass, function (err, isMatch) {
                if (err) {
                    res.json({ "err": err });
                }
                if (isMatch) {
                    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
                        if (err) {
                            console.log(err)
                        }

                        else {
                            bcrypt.hash(npass, salt, async function (err, hash) {
                                if (err) {
                                    console.log(err)
                                }
                                else {
                                    let mail = data.email;
                                    console.log(mail)
                                    let status = await eMail(mail, npass);

                                    let passnew = hash;
                                    console.log(status)
                                    if (status) {
                                        userSchema.findByIdAndUpdate({ '_id': id }, { $set: { 'password': passnew } }, function (err, data) {
                                            if (err) {
                                                console.log(err);
                                            }
                                            else {
                                                msg = "Admin Password Updated And Email Send"
                                                a.alert(msg)
                                                let pro=""
                                                let name=""
                                                res.render('index.html',{msg,pro,name});
                                            }
                                        })
                                    }
                                    else {
                                        res.json("Internal Error")
                                    }
                                }
                            });
                        }
                    });
                }
                if (!isMatch) {
                    msg = "Wrong PAssword"
                                                a.alert(msg)
                                                let pro=""
                                                let name=""
                                                res.render('index.html',{msg,pro,name});
                }
            })
        }
    })}


}

function register(req, res) {

    let nam = req.body.name || undefined;
    let age = req.body.age || undefined; 
    let email = req.body.email || undefined;
    let password = generator.generate({
        length: 10
    });

    if((nam == undefined) || (age==undefined)||(email==undefined)){
        res.send("All Field Required");
    }



    else {
    let status = eMail(email,password,undefined);
    if (status){    
    let testUser = new userSchema({ 'name': nam, 'age': age, 'email': email, 'password': password })

    testUser.save(function (err) {
        if (err) {
            if (err.code == '11000') {
                console.log(err);
                msg = "Email Already Registered"
                res.render('register.html', { msg });
            }
            else {
                msg = err
                res.render('register.html', { msg });
            }
        }
        else {
            msg = "Registered As User"
            let pro=""
            let name=""
            res.render("index.html",{msg,pro,name});
        }
    })
}
else{
    
    msg = "Error In Sending Mail Try Again"
    let pro=""
    let name=""
    res.render("index.html",{msg,pro,name});
}
}
}

function login(req, res) {

    let email = req.body.email || undefined;
    let pass = req.body.password || undefined;
    if((email == undefined) || (pass==undefined)){
        res.send("All Field Required");
    }
    else{
    userSchema.findOne({ email: email }, function (err, data) {


        if (err) {


        }

        else if (data == null) {
            res.send("User Not Found")

        }
        else {
            // test a matching password
            data.comparePassword(pass, function (err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    object_id = data.id;
                    role = data.role;
                    if ((role == 'admin') || (role == 'subadmin')) {

                        let token = generateToken(object_id, role)
                        let pro = data.profilepic;
                        let name = data.name;

                        msg = role;
                        res.cookie('name', token).redirect('/');

                    }
                    else {
                        res.json('Logged In as User');
                    }
                }
                else {

                    res.send("Wrong Password")
                }
            });


        }
    });}

}



function getUser(req, res) {

    userSchema.find({ 'role': 'user' ,'is_deleted': false }, function (err, data) {
        juser = data
        res.render('user.html', { juser });
    })

}
function getSubadmin(req, res) {

    userSchema.find({ 'role': 'subadmin' ,'is_deleted':false }, function (err, data) {
        juser = data
        res.render('subadmin.html', { juser });
    })

}


function changepass(req, res) {
    let id = req.params.id || undefined;

    if((id == undefined)){
        res.send("All Field Required");
    }
    else{
    userSchema.findOne({ '_id': id }, function (err, data) {
        if (err) {
            res.json("Error ")
        }
        else {
            console.log(data)
            let email = data.email;
            let name = data.name;
            res.render('changesubadminpass.html', { id, email, name });
        }
    })}
}
function changelinkpass(req, res) {
    let id = req.id;
    let link = req.params.id;
    if((id == undefined) || (link==undefined)){
        res.send("All Field Required");
    }
    else{
    console.log("????????????????????????", link);
    userSchema.findOne({ '_id': id }, function (err, data) {
        if (err) {
            res.json("Error ")
        }
        else {
            console.log(data)
            let email = data.email;
            let name = data.name;
            res.render('linkpass.html', { id, email, name, link });
        }
    })}
}
function mod(req, res) {
    let id = req.params.id;

    userSchema.findOne({ '_id': id }, (err, data) => {
        if (err) {
            console.log(err)
        }
        else {

            let name = data.name;
            let age = data.age;
            let email = data.email;
            let role = data.role;
            let id = data.id;
            let is_deleted = data.is_deleted;
            res.render('update.html', { name, age, email, role, id, is_deleted });
        }
    })
}


function modify(req, res) {
    let name = req.body.name || undefined;
    let age = req.body.age || undefined;
    let role = req.body.role || undefined;
    let id = req.body.id || undefined;
    let is_deleted = req.body.is_deleted || undefined;
    if((name == undefined) || (age==undefined)||(role ==undefined)||(id ==undefined)||(is_deleted ==undefined)){
        res.send("All Field Required");
    }
    else{
    userSchema.findByIdAndUpdate({ '_id': id }, { $set: { 'name': name, 'age': age, 'role': role, 'is_deleted': is_deleted } }, (err, data) => {
        if (err) {
            console.log(err)

        }
        else {
            if (role == 'subadmin') {
                res.redirect('/viewsubadmin');
            }
            else {
                res.redirect('/viewuser');
            }
        }
    })}
}
function del(req, res) {

    let id = req.params.id;
    userSchema.findOneAndUpdate({ '_id': id }, { $set: { 'is_deleted': 'true' } }, (err, data) => {
        if (err) {
            res.json("err")
        }
        else {
            role = data.role;

            if (role == 'user') {
                res.redirect('/viewuser');
            }
            else {
                res.redirect('/viewsubadmin');
            }
        }
    })
}
function registersubadmin(req, res) {


    let name = req.body.name || undefined;
    let age = req.body.age || undefined;
    let email = req.body.email || undefined;
    let password = req.body.pass || undefined;
    let role = 'subadmin'

    if((name == undefined) || (age==undefined)||(role ==undefined)||(email ==undefined)||(password ==undefined)){
        res.send("All Field Required");
    }
    else{
    let testUser = new userSchema({ 'name': name, 'age': age, 'email': email, 'password': password, 'role': role })

    testUser.save(function (err) {
        if (err) {

            if (err.code == '11000') {
                console.log(err);
                msg = "Email Already Registered"
                res.render('register.html', { msg });
            }
            else {
                msg = err
                res.render('register.html', { msg });
            }
        }
        else {
            

            msg = "Registered";
            a.alert(msg)
            let pro=""
            let name=""
            
            res.render('index.html',{msg,pro,name});

        }
    })}

}

function generateToken(value, role) {

    let token = jwt.sign({ 'id': value, 'role': role }, key.secret, { expiresIn: '1d' });
    return token;
}
function checkAuth(req, res, next) {

    let token = req.cookies.name;
        
    jwt.verify(token, key.secret, function (err, data) {
        if (err) {
            console.log(err);
            msg=err
            res.render('login.html',{msg});
        }
        else {
            console.log(data)
            let type = data.role;
            req.type = type;
            req.id = data.id
            next();
        }
    })
}

function eMail(email, password, link) {

    if (password == undefined) {

        var mailOptions = {
            from: 'munjal.chirag.test@gmail.com',
            to: email,
            subject: "Registration",
            html: '<p>Click <a href="https://sdirect-chirag.herokuapp.com/recover/' + link + '">here</a> to reset your password</p>'
        };
    }
    if (link == undefined) {
        var mailOptions = {
            from: 'munjal.chirag.test@gmail.com',
            to: email,
            subject: "Registration",
            html: 'Thanking You For Reg istering Your Email: ' + email + '  Password: ' + password
        };
    }
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (err) {

            if (err) {
                console.log(err);
                resolve(false);
            }
            else {
                resolve(true)
            }

        })
    })
}



function checkType(req, res, next) {
    let type = req.type;
    if (type == 'admin') {
        next();
    }
    else {
        msg = "Only Admin Is Authorized"
        res.redirect('/not');
    }

}
async function resetsapass(req, res) {
    let mail = req.email;
    let pass = req.pass
    let passnew = req.passnew


    let status = await eMail(mail, pass);
    if (status) {
        userSchema.findOneAndUpdate({ 'email': mail }, { $set: { 'password': passnew } }, function (err) {
            if (err) {
                console.log('got an error');
            }
            else {
                msg = "Password Changed & Mail Send"
                let pro=""
                let name=""
                res.render('index.html',{msg,pro,name});
                a.alert(msg)
            }
        });
    }
    else {
        msg="Internal Error"
        let pro=""
            let name=""
        res.render('index.html',{msg,pro,name});
        a.alert("Internal Error")
    }
}
function resetpass(req, res) {
   

    let mail = req.body.email || undefined;
    if((mail == undefined) ){
        res.send("All Field Required");
    }
    else{
    userSchema.findOne({ 'email': mail }, async (err, data) => {
        if (err) {
            msg="Internal Error"
            res.render('login.html',{msg});
            a.alert(err)
        }
        if (data == null) {
            console.log(data);
            msg="User Not Registered"
            res.render('login.html',{msg});
            a.alert("USer Not Registered")
        }
        else {
            let r=data.role;
            if(r=="subadmin"){
                msg="Request Admin"
                res.render('login.html',{msg});
                a.alert("Request Admin")
            }
            else{
            console.log(data);
            let id = data.id;
            let method = "resetpass"
            let token = await generateToken(id, method);
            let pass;
            let status = await eMail(mail, pass, token);
            if (status) {
                userSchema.findByIdAndUpdate({ '_id': id }, { $set: { 'passwordreset': token } }).exec((err, result) => {
                    if (err) {
                        msg=err
                        res.render('login.html',{msg});
                    }
                    else {
                        msg="Reset Link Has Been Send To Mail"
                        res.render('login.html',{msg});
                        a.alert("Reset Link Has Been Send To Mail")
                    }
                })
            }
        }
        }
    })}

    //let status= await eMail(mail,pass,link);
    // if(status){
    //     // userSchema.findOneAndUpdate({ 'email': mail }, { $set: { 'password': passnew } },function (err) {
    //     //     if (err) {
    //     //         console.log('got an error');
    //     //     }
    //     //     else {
    //     //             msg="Password Changed And Mail Send"
    //     //              res.redirect('/');
    //     //              alert(msg)
    //     //     }
    //     // });
    //      res.redirect('/');
    //      alert("Password Reset Link Has Been Sent to your Mail")
    // }
    // else{
    //     msg="Internal Error"
    //     res.redirect('/');
    //      alert(msg)
    // }
}
function decryppass(req, res, next) {
    var pass = req.pass;
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) {
            console.log(err)
        }

        else {
            bcrypt.hash(pass, salt, function (err, hash) {
                if (err) {
                    console.log(err)
                }
                else {
                    let passnew = hash;
                    console.log(passnew);
                    req.passnew = passnew;
                    req.pass = pass;
                    next();
                }
            });
        }
    });
}


function checkreset(req, res, next) {

    if (req.body.email) {
        let email = req.body.email || undefined 
        if(email == undefined){
            res.send("All Field Required");
        }
        else{
        userSchema.findOne({ 'email': email }, function (err, data) {
            if (err) {
                res.json("error")
            }
            else if (data == null) {
                msg="User Not Found"
                res.render('login.html',{msg});
            }
            else {
                let role = data.role;
                if (role == 'subadmin') {

                    res.json("Request Admin To Change Password")
                }
                else {
                    let pass = generator.generate({
                        length: 10
                    })
                    let email = data.email;
                    req.email = email;
                    req.pass = pass;
                    next();
                }
            }

        })}
    }

    if (req.body.id) {
        let id = req.body.id || undefined;
        let pass = req.body.password || undefined;
        console.log("jhjjjjjk")
        if((id==undefined) || (pass == undefined)){
            res.send("All Field Required");
        }
        else{
        userSchema.findById({ '_id': id }, function (err, data) {
            if (err) {
                console.log(err)
            }
            else {
                console.log(data);
                let email = data.email;
                req.pass = pass;
                req.email = email;
                next();

            }
        })}
    }
}


function fileupload(req, res) {
    let id = req.id;
    var form = new formidable.IncomingForm({
        uploadDir: path.join(__dirname, '../public/img/'), // don't forget the __dirname here
        keepExtensions: true
    });


    form.parse(req);
    
    form.on('fileBegin',(name,file)=>{
        let ext = file.name.substring(file.name.lastIndexOf('.') + 1);
        file.name = 'IMG-' + id + '.' + ext;
        file.path = form.uploadDir + file.name;
    }),
    
    form.on('file', (name, file) => {

        
        let n= file.name || undefined;
        let ext = file.name.substring(file.name.lastIndexOf('.') + 1);
        file.name = 'IMG-' + id + '.' + ext;
        if((n == undefined) || (n == null)){
            res.send("Please Select Image");
        }


        else
        {
        
        
        file.path = form.uploadDir + file.name;
        if(ext == "png" || ext == "jpeg"  || ext == "jpg"){
            console.log(file.path);
            cloudinary.v2.uploader.upload(file.path, {
                folder: 'chirag',
                use_filename: true,
                transformation: [
                    {
                        aspect_ratio: "1:1",
                        background: "#262c35",
                        border: "5px_solid_rgb:ff0000",
                        gravity: "auto",
                        radius: "max",
                        width: 1000,
                        crop: "fill"
                    }]
    
            }, function (error, result) {
    
                if(error){
                    res.send(error)
                    console.log(error);
                }
                else{

                
                userSchema.findOne({ '_id': req.id }, (err, data) => {
                    if (err) {
    
                    }
                    else if (data == null) {
                         res.redirect('/');
    
                    }
                    else {
                        data.profilepic = result.url;
                        data.save((err) => {
                            if (err) {
    
                            }
                            else {
                                msg = "File Uploaded";
                                a.alert(msg);
                                let pro=""
                                let name=""
                                res.render('index.html',{msg,pro,name});
                            }
                        })
    
                    }
                })
            }
            })}
            else{
                res.send(" Invalid Format Please Select Image with png jpg or jpeg format");
            }
        }
        
        
    });
}
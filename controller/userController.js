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
const alert = require('alert-node');
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
    let id = req.params.id;
    console.log(id);
    jwt.verify(id, key.secret, function (err, decode) {
        if (err) {
            res.redirect('/');
            alert("Invalid Token")
        }
        else {
            let role = decode.role;
            if (role == "resetpass") {
                req.id = decode.id;
                next();

            }
            else {
                res.redirect('/');
                alert("Invalid Token")
            }
        }
    })
}



function respass(req, res) {

    let token = req.body.link;
    let id = req.body.id;
    let pass = req.body.password;
    userSchema.findOne({ '_id': id, 'passwordreset': token }).exec((err, data) => {
        if (err) {
            console.log(err)
        }
        else if (data == null) {
            res.redirect('/');
            alert("Link Expired")
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
                    alert("Password Changed")
                }
            })
        }
    })


}



function adminpass(req, res) {
    let id = req.id;
    let pass = req.body.pass;
    let npass = req.body.newpass;
    console.log(id, ">>>>>>>>>", pass, ">>>>>>>>", npass);
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
                                                let pro = data.profilepic;
                                                let name = data.name;
                                                res.render('index.html', { msg, pro, name });
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
                    res.json("not matched");
                }
            })
        }
    })


}

function register(req, res) {

    let name = req.body.name;
    let age = req.body.age; 7500
    let email = req.body.email;
    let password = generator.generate({
        length: 10
    });




    let testUser = new userSchema({ 'name': name, 'age': age, 'email': email, 'password': password })

    testUser.save(function (err, data) {
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
            let pro = "";
            let name = "";
            msg = "Registered As User"
            res.render('index.html', { msg, pro, name });
        }
    })
}

function login(req, res) {

    let email = req.body.email;
    let pass = req.body.password;

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
                        let pro=data.profilepic;
                                                        let name=data.name;
                                                    
                        msg = role;
                        res.cookie('name', token).render('index.html', { msg,pro,name });

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
    });

}



function getUser(req, res) {

    userSchema.find({ 'role': 'user' }, function (err, data) {
        juser = data
        res.render('user.html', { juser });
    })

}
function getSubadmin(req, res) {

    userSchema.find({ 'role': 'subadmin' }, function (err, data) {
        juser = data
        res.render('subadmin.html', { juser });
    })

}


function changepass(req, res) {
    let id = req.params.id;
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
    })
}
function changelinkpass(req, res) {
    let id = req.id;
    let link = req.params.id;
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
    })
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
    let name = req.body.name;
    let age = req.body.age;
    let role = req.body.role;
    let id = req.body.id;
    let is_deleted = req.body.is_deleted;
    console.log(is_deleted)
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
    })
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


    let name = req.body.name;
    let age = req.body.age;
    let email = req.body.email;
    let password = req.body.pass;
    let role = 'subadmin'

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
            let pro="";
                                                        let name="";
                                                        msg="Registered"
                                                    res.render('index.html',{msg,pro,name});

        }
    })

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
            res.render('login.html');
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
    console.log("passwrd", password)
    console.log("Link", link)
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
                let name=""
                let pro=""
                res.render('index.html', { msg ,name,pro});
            }
        });
    }
    else {

        res.redirect('/');
        alert("Internal Error")
    }
}
async function resetpass(req, res) {
    let mail = req.body.email;

    userSchema.findOne({ 'email': mail }, async (err, data) => {
        if (err) {
            res.redirect('/');
            alert(err)
        }
        if (data == null) {
            console.log(data);
            res.redirect('/');
            alert("Please Register Your Account")
        }
        else {
            console.log(data);
            let id = data.id;
            let method = "resetpass"
            let token = await generateToken(id, method);
            let pass;
            let status = await eMail(mail, pass, token);
            if (status) {
                userSchema.findByIdAndUpdate({ '_id': id }, { $set: { 'passwordreset': token } }).exec((err, result) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        res.redirect('/');
                        alert("Reset Link Has Been Send To Mail")
                    }
                })
            }
        }
    })

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
        let email = req.body.email
        userSchema.findOne({ 'email': email }, function (err, data) {
            if (err) {
                res.json("error")
            }
            else if (data == null) {
                res.redirect('/');
                alert("Email Not Registered")
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

        })
    }

    if (req.body.id) {
        let id = req.body.id;
        let pass = req.body.password;
        console.log("jhjjjjjk")
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
        })
    }
}


function fileupload(req, res) {
    let id = req.id;
    var form = new formidable.IncomingForm({
        uploadDir: path.join(__dirname, '../public/img/'), // don't forget the __dirname here
        keepExtensions: true
    });


    form.parse(req)
        .on('fileBegin', (name, file) => {

            let ext = file.name.substring(file.name.lastIndexOf('.') + 1);
            console.log(ext);
            file.name = 'IMG-' + id + '.' + ext;
            file.path = form.uploadDir + file.name;
            console.log(file.path);
            //    cloudinary.v2.uploader.upload(file.name, 
            //    function(error, result) {console.log(result, error); });


        })
    form.on('file', (name, file) => {

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

            if (error) {
                // console.log("EEEEEEEEEEEEEE",error);
            }
            else
                // console.log("CCCCCCCCCCCCC",result);
                console.log(req.id);
            userSchema.findOne({ '_id': req.id }, (err, data) => {
                if (err) {

                }
                else if (data == null) {
                    alert("error");

                }
                else {
                    data.profilepic = result.url;
                    data.save((err) => {
                        if (err) {

                        }
                        else {
                            msg = "File Uploaded";
                            alert(msg);
                            res.redirect('/');
                        }
                    })

                }
            })

        })
    });
}


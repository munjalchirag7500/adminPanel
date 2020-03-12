const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const control = require('../controller/userController')
SALT_WORK_FACTOR = 10;
const UserSchema = new Schema({
    name: { type: String },
    age: { type: Number },
    email: { type: String, unique: true },
    password: String,
    role: {
        type: String,
        enum: ['admin', 'subadmin', 'user'],
        default: 'user'
    },
    is_deleted: { type: Boolean, default: false },
    passwordreset:String,
    profilepic:String
});

UserSchema.pre('save',function (next) {
    var user = this;




    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);


        bcrypt.hash(user.password, salt, async function (err, hash) {
            if (err) return next(err);

            else {
                opass = user.password;
                let status = await control.eMail(user.email, opass);
                console.log(status);
                if (status == false) {
                    return next(new Error('Internal error'))
                }
                else {
                    user.password = hash;
                    console.log(user.password);
                    next();
                }
            }
        });
    });

});

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};



module.exports = mongoose.model('user', UserSchema)
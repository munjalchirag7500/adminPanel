const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const control = require('../controller/userController')
SALT_WORK_FACTOR = 10;
const validate = require('mongoose-validator')

var nameValidator = [
    validate({
        validator: 'isLength',
        arguments: [3, 40],
        passIfEmpty: true,
        message: 'Name should be between {ARGS[0]} and {ARGS[1]} characters',
    }),
    validate({
        validator: 'isAlphanumeric',
        passIfEmpty: true,
        message: 'Name should contain alpha-numeric characters only',
    }),
]
var ageValidator = [
    validate({
        validator: 'isLength',
        arguments: [2, 3],
        passIfEmpty: true,
        message: 'Age should be Above 18 and Below 100',
    }),
    validate({
        validator: 'isNumeric',
        passIfEmpty: true,
        message: 'Age should contain numeric characters only',
    }),
]
var passValidator = [
    validate({
        validator: 'isLength',
        arguments: [8],
        passIfEmpty: true,
        message: 'Pawword Length Should Be Between 8 and 32',
    })
]
var emailValidator = [
    validate({
        validator: 'isEmail',
        passIfEmpty: true,
        message: 'Invalid Email',
    }),
]
const UserSchema = new Schema({
    name: { type: String, validate: nameValidator,required:false },
    age: { type: String, validate: ageValidator,required:false },
    email: { type: String, unique: true, validate: emailValidator ,required:false},
    password: { type: String, validate: passValidator },
    role: {
        type: String,
        enum: ['admin', 'subadmin', 'user'],
        default: 'user'
    },
    is_deleted: { type: Boolean, default: false },
    passwordreset: String,
    profilepic: String
});

UserSchema.pre('save', function (next) {
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
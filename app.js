var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose=require('mongoose');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const cloudinary=require('cloudinary');
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.engine('html', require('ejs').renderFile)
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

cloudinary.config({ 
  cloud_name: 'dvpx0yuav', 
  api_key: '125218487457649', 
  api_secret: 'FtfT8_46YkrzaHGhTv-p_TH3MbQ' 
});


app.use('/', indexRouter);
app.use('/users', usersRouter);



mongoose.connect('mongodb+srv://munjalchirag:munjalchirag@cluster0-vk00a.gcp.mongodb.net/user?retryWrites=true&w=majority',{ useNewUrlParser: true,useUnifiedTopology: true } ,(err,result)=>{
  if(result){
    console.log("Connected To Database")
  }
  console.log(err,'error')
})

// mongoose.connect('mongodb://chiragmunjal:chiragmunjal@192.168.0.5/chiragmunjal',{ useNewUrlParser: true,useUnifiedTopology: true } ,(err,result)=>{
//   if(result){
//     console.log("Connected To Database")
//   }
//   console.log(err,'error')
// })
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

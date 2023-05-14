require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");

const  {connectToDB} = require("./config/connection");
const session=require('express-session');
const flash = require('connect-flash');
const exphbs  = require('express-handlebars');
const hbs = require('hbs');
const fileUpload = require('express-fileupload')

const app = express();





// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.engine('hbs', exphbs.create({
  extname: 'hbs',
  defaultLayout: 'adminLayout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/'
}).engine);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({secret:'key',resave: false,saveUninitialized: true,cookie:{maxAge:600000}}));
app.use(flash());
app.use(fileUpload());


startDb()

app.use("/", userRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

async function startDb(){
  await connectToDB()
}


module.exports = app;

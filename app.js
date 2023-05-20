var createError = require("http-errors");
var express = require("express");
var path = require("path");


const handlebars = require('handlebars')

var cookieParser = require("cookie-parser");
var logger = require("morgan");
var hbs = require("express-handlebars");
require("dotenv").config();
var session = require("express-session");

var db = require("./config/connection");
const mathHelpers = require('./helpers/mathHelpers');


var adminRouter = require("./routes/admin");
var usersRouter = require("./routes/users");
const bodyParser = require("body-parser");
// const fileUpload = require("express-fileupload");

var app = express();
const jsonParser = bodyParser.json();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(jsonParser);
handlebars.registerHelper(mathHelpers);

// app.use(fileUpload())

app.use(
  session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
    resave: false,
  })
);


app.use("/admin", adminRouter);
app.use("/", usersRouter);

app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
  })
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
db.connect((err) => {
  if (err) console.log("connection error" + err);
  else console.log("database connected");
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

module.exports = app;

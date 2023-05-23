var userHelper = require("../helpers/user-helper");
var productHelpers = require("../helpers/productHelper");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSID = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountSid, authToken);
const objectId = require("mongodb-legacy").ObjectId;
const cartHelper= require('../helpers/cartHelpers')
const { default: axios } = require('axios');
const { log } = require("handlebars/runtime");
const cartHelpers = require("../helpers/cartHelpers");


module.exports = {
  userSignup: (req, res) => {
    res.render("user/signUp");
  },
  userSignupPost: (req, res) => {
    // Check if the password and rePassword fields match
    if (req.body.Password !== req.body.rePassword) {
      res.render("user/signUp", { errMsg: "Password does not match" });
      return;
    }

    // Remove the rePassword field from the request body
    delete req.body.rePassword;

    // Validate the password using regular expressions
    // const passwordRegex =
    //   /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    // if (!passwordRegex.test(req.body.Password)) {
    //   res.render("user/signUp", {
    //     errMsg:
    //       "Password must contain 8 characters, uppercase, lowercase, number, and special(!@#$%^&*)",
    //   });
    //   return;
    // }

    // Validate the mobile number using regular expressions
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(req.body.mobile)) {
      res.render("user/signUp", {
        errMsg: "Mobile number should be 10 digit number",
      });
      return;
    }
    mob = req.body.mobile;
    userHelper.verifyMobile(mob).then((response) => {
      if (response == "user Exist") {
        res.render("user/login", { errMsg: response });
      } else {
        // otp send
        client.verify.v2
          .services(serviceSID)
          .verifications.create({ to: "+91" + mob, channel: "sms" })
          .then(() => {
            req.session.userDetails = req.body;
            res.redirect("/otpVerification");
          });
      }
    });
  },
  otpVerificaionPage: (req, res) => {
    res.render("user/otp");
  },
  otpVerificaionSignup: (req, res) => {
    const userOtp = req.body.otp;
    const mobile = req.session.userDetails.mobile;
    // otp verify
    client.verify.v2
      .services(serviceSID)
      .verificationChecks.create({ to: "+91" + mobile, code: userOtp })
      .then((verification_check) => {
        if (verification_check.status === "approved") {
          // If the OTP is approved,Call the userSignup method to create the user
          userHelper
            .userSignup(req.session.userDetails)
            .then((response) => {
              if (response == "Email already exist !") {
                req.session.errMsg = response;
                res.render("user/signUp", { errMsg: req.session.errMsg });
              } else {
                res.redirect("/login");
              }
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
          // If the OTP is not approved, render the OTP verification page with an error message
          res.render("user/otp", { errMsg: "Invalid OTP" });
        }
      })
      .catch((error) => {
        console.log(error);
        // Render the OTP verification page with an error message
        res.render("user/otp", {
          errMsg: "Something went wrong. Please try again.",
        });
      });
  },
  userHome: async(req, res) => {
    let productData= await productHelpers.getProducts()
    let BestSeller = productData.slice(0, 6); 
    let BestProducts = productData.slice(Math.max(productData.length-6,0));
    if (req.session.user) {
      res.render('user/index', {user:req.session.user, userName:req.session.userName,BestSeller,BestProducts});
    } else {
      res.render("user/index",{BestSeller,BestProducts});
    }
  },
  ifLogged: (req, res, next) => {
    if (req.session.userLoggedIn) {
      res.redirect("/");
    } else {
      res.render('user/login')
    }
  },
  logout: (req, res) => {
    req.session.userLoggedIn = false;
    req.session.userName = false;
    res.redirect("/");
  },
  userLogin: (req, res) => {
    res.render("user/login");
  },
  checkLoggedIn: (req, res, next) => {
    if (req.session.userLoggedIn) {
      next();
    } else {
      res.render('user/login')
    }
  },
  userLoginPost: (req, res) => {
    userHelper.doLogin(req.body).then((response) => {
      if (response.status == "Invalid User") {
        res.render("user/login", { errMsg: response.status });
      } else if (response.status == "Invalid Password") {
        res.render("user/login", { errMsg: response.status });
      } else if (response.status == "User Blocked") {
        res.render("user/login", { errMsg: response.status });
      } else {
        req.session.user = response.user;
        req.session.userName = response.user.name;
        req.session.userLoggedIn = true
        res.redirect("/");
      }
    });
  },

  productPage: async (req, res) => {
    const productData = req.params.id;
    productHelpers
      .getSingleProduct(productData)
      .then( (product) => {
        var images = product.images
        res.render("user/productPages", {
          product,images, userName:req.session.userName,user:req.session.user
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  addToCart: (req, res) => {
    const productId = req.params.id;
    const quantity = 1;
    cartHelper.addToCart(productId, req.session.user._id, quantity,req.session.userLoggedIn).then(() => {
      res.json({
        status: "successs",
        message: "added to cart",
      });
    });
  },
  cart: async (req, res) => {
    const userName = req.session.user.name;
    const userId = req.session.user._id;
    const userDetailes = await cartHelper.getCart(userId);
    if (!userDetailes.length == 0) {
      await cartHelper.getCartTotal(req.session.user._id).then((total) => {
        res.render("user/cart", {
          userName:req.session.userName,user:req.session.user,
          userDetailes,
          total: total,
        });
      });
    } else {
      res.render("user/cart", {userName:req.session.userName,user:req.session.user });
    }
  },
  changeProductQuantity: (req, res, next) => {

    try {
      cartHelper
        .changeProductQuantity(req.session.user._id, req.body)
        .then(async (response) => {
          if (!response.removeProduct) {
            response.total = await cartHelper.getCartTotal(req.session.user._id);
            res.json(response);
          } else {
            res.json(response);
          }
        });
    } catch (err) {
      console.log(err);
    }
  },
  shopPage: async(req, res) => {
    let productData= await productHelpers.getProducts()
    let category = await productHelpers.getProductCategory()
    if (req.session.user) {
      res.render('user/shop', {user:req.session.user, userName:req.session.userName,productData,category});
    } else {
      res.render("user/shop",{productData,category});
    }
  },
  deleteCart: (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.id;
    cartHelper.deleteCart(productId, userId).then(() => {
      res.json({
        status: "success",
        message: "Product deleted from cart",
      });
      // res.redirect('back');
    });
  },

  checkOutPage: async (req, res) => {
    const userName = req.session.user.name;
    const addresses = await userHelper.getAddress(req.session.user._id);
    await cartHelper
      .getCartTotal(req.session.user._id)
      .then((total) => {
        res.render("user/checkOut", {
          userName,
          addresses,
          total,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  addAdress:(req,res)=>{
    try{
      userHelper.addAddress(req.body,req.session.user._id)
      res.redirect('back')
    }catch(err){
      console.log(err);
    }
  },
  editAddress:(req,res)=>{
    try{
      const address = req.params.id;
      userHelper.editAddress(req.body,req.session.user._id,address)
      res.redirect("back")
    }catch(err){
      console.log(err);
    }
  },
  deleteAddress:(req,res)=>{
    const addressId = req.params.id
    console.log(addressId);
    userHelper.deleteAddress(addressId,req.session.user._id)
    res.redirect("back")
  },
  placeOrder: async (req, res) => {
    try {
      const addressId = req.body.address;
      const userDetails = req.session.user;
      // console.log(userDetails + "user detailes");
      const total = await cartHelpers.getCartTotal(req.session.user._id);
      const paymentMethod = req.body.paymentMethod;
      const shippingAddress = await userHelper.findAddress(addressId,req.session.user._id);
      const cartItems = await cartHelpers.getCart(req.session.user._id);
      const now = new Date();
      const status = req.body.paymentMethod === "COD" ? "placed": "pending";
      const order = {
        userId: new objectId(req.session.user._id),
        userName: req.session.userName,
        item: cartItems,
        shippingAddress: shippingAddress,
        total: total,
        paymentMethod: paymentMethod,
        products: cartItems,
        date: new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0,0),
        status,
        coupon: req.body.coupon,
      };
      const userId = req.session.user._id;
      userHelper.addOrderDetails(order, userId)
        .then((order) => {
          cartHelpers.deletCartFull(req.session.user._id);

          if (req.body.paymentMethod === "COD") {
            res.json({
              status: true,
              paymentMethod: req.body.paymentMethod,
            });

          }
        });
    } catch (err) {
      console.log(err);
    }
  },
  }



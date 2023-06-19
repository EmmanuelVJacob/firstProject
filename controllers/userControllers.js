var userHelper = require("../helpers/userHelper");
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
const { response } = require("express");
const paypal=require('paypal-rest-sdk')

const paypal_client_id = process.env.PAYPAL_CLIENT_ID;
const paypal_client_secret = process.env.PAYPAL_CLIENT_SECRET;

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': paypal_client_id,
  'client_secret': paypal_client_secret
});

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
    const totalProducts = await productHelpers.totalPages();
    const currentPage = req.query.page || 1;
    let productData= await productHelpers.getProducts(currentPage)
    let category = await productHelpers.getProductCategory()
    totalPages = Math.ceil(totalProducts/3)
    let arr = []
    for (let i = 1;i<=totalPages;i++){
      arr.push(i)
    }
    if (req.session.user) {
      if(req.session.sortedProduct){
        let HTL
        let LTH 
        let sortValue = req.session.sort
        if(sortValue == 1){
           LTH = true
           HTL = false
        }else if(sortValue == -1){
          LTH = false
          HTL = true
        }
        let sortedProduct = req.session.sortedProduct
        let categoryName = req.session.category
        res.render("user/shop",{user:req.session.user, userName:req.session.userName,productData:false,sortedProduct,category,totalPages,currentPage,arr,categoryName,LTH,HTL});
        req.session.sortedProduct = false
      }else if(req.session.filteredProduct){
        let minPrice = req.session.minPrice
        let maxPrice = req.session.maxPrice
        let categoryName = req.session.category
        let filteredProducts = req.session.filteredProduct
        res.render("user/shop",{user:req.session.user, userName:req.session.userName,productData:false,filteredProducts,category,totalPages,currentPage,arr,categoryName,minPrice,maxPrice});
        req.session.filteredProduct = false
      }else{
        res.render("user/shop",{user:req.session.user, userName:req.session.userName,productData,category,totalPages,currentPage,arr});
      }   
    
    } else {
      if(req.session.sortedProduct){
        let HTL
        let LTH 
        let sortValue = req.session.sort
        if(sortValue == 1){
           LTH = true
           HTL = false
        }else if(sortValue == -1){
          LTH = false
          HTL = true
        }
        let categoryName = req.session.category
        let sortedProduct = req.session.sortedProduct
        res.render("user/shop",{productData:false,sortedProduct,category,totalPages,currentPage,arr,categoryName,LTH,HTL});
        req.session.sortedProduct = false
      }else if(req.session.filteredProduct){
        let minPrice = req.session.minPrice
        let maxPrice = req.session.maxPrice
        let categoryName = req.session.category
        let filteredProducts = req.session.filteredProduct
        res.render("user/shop",{productData:false,filteredProducts,category,totalPages,currentPage,arr,categoryName,minPrice,maxPrice});
        req.session.filteredProduct = false
      }else{
      res.render("user/shop",{productData,category,totalPages,currentPage,arr});
      }
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
    const userName = req.session.user;
    const user = req.session.user
    const addresses = await userHelper.getAddress(req.session.user._id);
    const availableCoupons = await userHelper.availableCoupons(user._id)
    await cartHelper
      .getCartTotal(req.session.user._id)
      .then((total) => {
        res.render("user/checkOut", {
          userName,
          addresses,
          total,user,availableCoupons
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
    userHelper.deleteAddress(addressId,req.session.user._id)
    res.redirect("back")
  },
  placeOrder: async (req, res) => {
    try {
      const addressId = req.body.address;
      const userDetails = req.session.user;
      // console.log(userDetails + "user detailes");
      // const total = await cartHelpers.getCartTotal(req.session.user._id);
      const total = req.body.total;
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

          }else if (req.body.paymentMethod === "card"){
            const orderId = order.insertedId;
            console.log(total);
            userHelper.generateRazorpay(orderId,total).then((response)=>{
              res.json({
                response: response,
                paymentMethod:"card",
                userDetails: userDetails
              })
            })
            }else{
              const exchangeRate = 0.013;
              // console.log(req.body.total+"Total amount!!!!!");
              const totalCost = (Number(req.body.total)*exchangeRate).toFixed(0);
              req.session.totalCost = totalCost;
              const create_payment_json = {
                intent: "sale",
                payer: {
                  payment_method: "paypal",
                },
                redirect_urls: {
                  return_url: "http://timezonewatches.shop/success",
                  cancel_url: "http://timezonewatches.shop/cancel",
                },
                transactions: [
                  {
                    amount: {
                      currency: "USD",
                      total: `${totalCost}`,
                    },
                    description: "TimeZone Watches",
                  },
                ],
              };
    
              paypal.payment.create(create_payment_json, function (error, payment) {
              
                if (error) {
                  console.log(error, "ASASASS");
                  res.render('user/failure', {user:true, userName: req.session.userName});
                } else if(payment){
                  try{
                    userHelper.changeOrderStatus(order.insertedId).then(()=>{console.log("changed")}).catch(()=>{});
                    // productHelpers.reduceStock(cartList).then(()=>{}).catch((err)=>console.log(err));
                  }catch(err){
                    console.log(err);
                  }finally{
                    for (let i = 0; i < payment.links.length; i++) {
                      if (payment.links[i].rel === "approval_url") {
                        res.json({
                          approval_link: payment.links[i].href,
                          status: "success"
                        })
                      }
                    }
                  }
                }
              });
            }
        });
    } catch (err) {
      console.log(err);
    }
  },
  orders:async(req,res)=>{
    const user = req.session.user
    const userName = req.session.userName;
    const userId = req.session.user._id
    const orders = await userHelper.getOrders(userId)
    orders.forEach(order => {
      order.isCancelled = order.status === 'cancelled'? true:false;
      order.isDelivered = order.status === 'Delivered'? true:false;
      order.isReturned = order.status === 'Return'? true:false;

      const newDate = new Date(order.date)
      const year = newDate.getFullYear();
      const month = newDate.getMonth();
      const day = newDate.getDate();
      const formattedDate = `${day < 10 ? '0' + day : day}-${month < 10 ? '0' + month : month}-${year}`;
      order.date = formattedDate;
    });
    res.render('user/orders',{userName,orders,user})
  },
  viewDet: async (req, res) => {
    const userName = req.session.userName;
    const orderId = req.params.id;
    const user = req.session.user
    const orders = await userHelper.getOrderedProducts(orderId);
    res.render("user/viewDet", { user, userName, orders });
  },
  deleteOrder:(req,res)=>{
    const orderId = req.params.id
    const reason = req.body.reason
    console.log(reason,'sdfhsdfsdfsdf');
    userHelper.deleteOrder(orderId,reason).then(()=>{
      res.redirect('back')
    })
  },
  returnOrder:(req,res)=>{
    const orderId = req.params.id

    userHelper.returnProduct(orderId).then(()=>{
      res.redirect('back')
    })
  },
  getCategoryWiseProducts: async(req, res) => {
    CategoryID = req.params.name 
    req.session.category= CategoryID
    const totalProducts = await productHelpers.totalcategoryproducts();
    const currentPage = req.query.page || 1;
    const arr = []
    totalPages = Math.ceil(totalProducts/3)
    for (let i = 1;i<=totalPages;i++){
      arr.push(i)
    }
    let productData= await productHelpers.getCategoryWiseProducts(CategoryID,currentPage)
    let category = await productHelpers.getProductCategory()
    if (req.session.user) {
      let categoryName = req.session.category
      res.render('user/shop', {user:req.session.user, userName:req.session.userName,productData,category,arr,currentPage,categoryName});
    } else {
      let categoryName = req.session.category
      res.render("user/shop",{productData,category,arr,currentPage,categoryName});
    }
  },
  verifyPayment:(req,res)=>{
    try{
      userHelper.verifyPayment(req.body).then(()=>{
        userHelper.changeOrderStatus(req.body.order.receipt).then(()=>{
          res.json({
            status:true
          })
        })
      })
    }catch(err){
      console.log(err);
    }
  },
  couponApply:(req,res)=>{
    const userId = req.session.user._id
    userHelper.couponApply(req.body.couponCode,userId).then((coupon)=>{
      if(coupon){
        if(coupon === "couponExists"){
          res.json({
            status:"coupon is already used, try another coupon"  
          })
        }else{
            res.json({
              status:"success",
              coupon:coupon
       
          })

        
        }
      }else{
        res.json({
          status:"coupon is not valid!!"
        })
      }
    })
  },

  paypalSuccess: (req, res)=>{
    const exchangeRate = 0.013;
    
    const totalCost = req.session.totalCost;
    req.session.totalCost = null;
    // console.log(totalCost,"vannuuuuuuuuuuuuuuuuu");
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: `${totalCost}`,
          },
        },
      ],
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment)=>{
      console.log(payment,"poyiiiiiiiiiiiiiiiii");

      if (payment) {
        const userName = req.session.userName;
        res.render('user/success', {user:req.session.user, payerId, paymentId, userName});

      } else {
        console.log(error, "asasasasass");
        const userName = req.session.userName;
        res.render('user/failure', {user:req.session.user, userName});
      
      }
    });
  },


  failure:(req, res) => {
    console.log('emmanuyel failed');
    res.render('user/failure', {user: true,user:req.session.user, userName: req.session.userName});
  },
  forgotPassword: (req, res) => {
    res.render('user/forgot', {user: true, loginError: req.session.loginError})
    req.session.loginError = false;
  },
  forgotPasswordPost:(req, res) => {
    let mobile = req.body.phone;
    userHelper.doLoginWithMobile(mobile).then((response) => {
      if(response.status){
        req.session.user = response.user;
        req.session.userName = req.session.user.name;
        client.verify.v2.services(serviceSID)
            .verifications
            .create({to:`+91${mobile}`, channel: 'sms'})
            .then(verification => {
              console.log(verification.status);
              res.render('user/forgotPasswordVerify', {user:true, mobile});
            })
            .catch(error => console.error(error));
      }else{
        req.session.loginError = "Mobile Number is not registered"
        res.redirect('/forgotPassword')
      }
    })
  },

  forgotPasswordVerify: (req, res) =>{
    let otp = req.body.otp;
    let mobile = req.body.phone;

    try{
      client.verify.v2.services(serviceSID)
        .verificationChecks
        .create({to: `+91${mobile}`,code: otp})
        .then(verification_check => {
          console.log(verification_check.status);
          if(verification_check.valid){
             req.session.userLoggedIn = true;
            res.render('user/setNewPassword', {user:true, mobile});
          }else{
            res.render('user/forgotPasswordVerify', {user:true, mobile, status:true});
          }
        })
    }catch(err){
      console.log(err);
      res.render('user/forgotPasswordVerify', {user:true, mobile, status:true});
    }
  },

    setNewPassword: (req, res) =>{
      userHelper.setNewPassword(req.body).then(() => {
      res.redirect('/');
    });
  },
  sortPrice: async (req, res) => {
    try {
      const currentPage = req.query.page || 1;
      req.session.minPrice = req.body.minPrice;
      req.session.maxPrice = req.body.maxPrice;
      const category = req.session.category;
      req.session.sort = req.body.sort
      req.session.sortedProduct = await productHelpers.sortPrice(req.body,category);
      res.json({
        status: "success",
      });
    } catch (err) {
      console.log(err);
    }
  },
  priceFilter: async (req, res) => {
    try {
      req.session.minPrice = req.body.minPrice;
      req.session.maxPrice = req.body.maxPrice;
      const category = req.session.category;
      req.session.filteredProduct = await productHelpers.filterPrice(req.session.minPrice,req.session.maxPrice,category);
      res.json({
        status: "success",
      });
    } catch (err) {
      console.log(err);
    }
  },
 userProfile: async (req, res) => {
    const userName = req.session.userName;
    // const address = await userHelpers.getAddress(req.session.user._id);
    const userProfile = await userHelper.getUser(req.session.user._id);
    // console.log(address+"wooooooooooooooooooooooooooooooow");
    const userid = req.session.user._id;
    const wallet = await userHelper.getWallet(userid);
    const walletBalance = wallet.bal
    res.render("user/userProfile", {user: req.session.user,userName,userProfile,walletBalance});
  },
  }



var express = require("express");
var router = express.Router();
var userHelper = require("../helpers/userHelper");
var userControllers = require("../controllers/userControllers");

/* GET home page. */
router.get("/", userControllers.userHome);

router.get("/login",userControllers.ifLogged, userControllers.userLogin);

router.get('/logout',userControllers.logout,userControllers.ifLogged)

router.get("/signUp", userControllers.userSignup);

router.post("/signUp", userControllers.userSignupPost);

router.get("/otpVerification", userControllers.otpVerificaionPage);

router.post("/otpVerification", userControllers.otpVerificaionSignup);

router.post('/',userControllers.userLoginPost)
router.get('/forgotPassword',userControllers.forgotPassword)
router.post('/forgotPasswordPost',userControllers.forgotPasswordPost)
router.post('/forgotPasswordVerify',userControllers.forgotPasswordVerify)
router.post('/setNewPassword',userControllers.setNewPassword)

router.get('/product/:id', userControllers.productPage);
router.get('/addToCart/:id',userControllers.addToCart)
router.get('/cart',userControllers.checkLoggedIn,userControllers.cart)
router.post('/change-product-quantity', userControllers.checkLoggedIn, userControllers.changeProductQuantity);

router.get('/shop',userControllers.shopPage)
router.post('/shopPriceFilter',userControllers.priceFilter)
router.post('/shopPriceSort',userControllers.sortPrice)
router.get('/deleteCart/:id', userControllers.checkLoggedIn, userControllers.deleteCart);
router.get('/checkOut',userControllers.checkLoggedIn, userControllers.checkOutPage);

router.post('/addAddress',userControllers.checkLoggedIn,userControllers.addAdress)
router.post('/editAddress/:id',userControllers.checkLoggedIn,userControllers.editAddress)
router.get('/deleteAddress/:id',userControllers.checkLoggedIn,userControllers.deleteAddress)
router.post('/placeOrder',userControllers.checkLoggedIn,userControllers.placeOrder)

router.get('/orders',userControllers.checkLoggedIn,userControllers.orders)
router.get('/orders/viewProduct/:id',userControllers.checkLoggedIn,userControllers.viewDet)
router.post('/cancelOrder/:id',userControllers.checkLoggedIn,userControllers.deleteOrder)
router.post('/returnOrder/:id',userControllers.checkLoggedIn,userControllers.returnOrder)

router.get('/categoryFilter/:name',userControllers.getCategoryWiseProducts)

router.post('/verifyPayment',userControllers.checkLoggedIn,userControllers.verifyPayment)
router.post('/couponApply',userControllers.checkLoggedIn,userControllers.couponApply)
router.get('/success',userControllers.checkLoggedIn,userControllers.paypalSuccess)
router.get('/cancel',userControllers.checkLoggedIn,userControllers.failure)
router.get('/userProfile',userControllers.checkLoggedIn,userControllers.userProfile)

module.exports = router;

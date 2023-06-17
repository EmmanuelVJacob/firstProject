var express = require("express");
const adminController = require("../controllers/adminController");
var router = express.Router();
const multer = require("../utils/multer");
const userHelper = require("../helpers/userHelper");
const userControllers = require("../controllers/userControllers");



/* GET users listing. */
router.get("/", adminController.checkLoggedIn, adminController.adminPanel);
router.post("/", adminController.adminLoginPost);
router.get("/login", adminController.ifLogged, adminController.adminLogin);
router.get(
  "/logout",
  adminController.checkLoggedIn,
  adminController.adminLogout
);
router.get(
  "/accounts",
  adminController.checkLoggedIn,
  adminController.accounts
);
router.get("/addUser", adminController.checkLoggedIn, (req,res)=>{
    res.render('admin/addUser',{admin:true})
});
router.post("/addUser", adminController.checkLoggedIn, adminController.addUser);

router.get(
  "/deleteUser/:id",
  adminController.checkLoggedIn,
  adminController.deleteUser
);
router.get(
  "/product",
  adminController.checkLoggedIn,
  adminController.adminProduct
);
router.post(
  "/addProductCategory",
 adminController.checkLoggedIn,
 adminController.addProductCategory
)
router.get(
  "/getProdCategoryToAddProduct",
  adminController.checkLoggedIn,
  adminController.getProdCategoryToAddProduct
);
router.post(
  "/addProduct",
  adminController.checkLoggedIn,
  multer.array('image',5),
  adminController.addProduct
);
router.get(
  "/editProductPage/:id",
  adminController.checkLoggedIn,
  adminController.editProductGet
);
router.post(
  "/editProduct/:id",
  adminController.checkLoggedIn,
  multer.array("image"),
  adminController.editProduct
)
router.post('/deleteSelectedImg',adminController.checkLoggedIn,adminController.deleteProductImages)
router.post(
  "/searchProduct",
  adminController.checkLoggedIn,
  adminController.searchProduct
);
router.get(
  "/deleteProduct/:id",
  adminController.checkLoggedIn,
  adminController.deleteProduct
)
router.get(
  "/unlistProduct/:id",
  adminController.checkLoggedIn,
  adminController.unlistProduct
)
router.get(
  "/listProduct/:id",
  adminController.checkLoggedIn,
  adminController.listProduct
)
router.get('/categoryPage',
adminController.checkLoggedIn,
adminController.categoryPage)


router.get(
  "/deleteProductCategory/:id",
  adminController.checkLoggedIn,
  adminController.deleteProductCategory
);

router.get(
  '/listCategory/:id',
  adminController.checkLoggedIn,
  adminController.listCategory
)
router.get(
  "/Block/:id",
  adminController.checkLoggedIn,
  adminController.blockUser
);
router.get(
  "/UnBlock/:id",
  adminController.checkLoggedIn,
  adminController.UnBlockUser
);
router.post(
  "/searchUser",
  adminController.checkLoggedIn,
  adminController.searchUser
);
router.get('/order',adminController.checkLoggedIn,adminController.adminOrder)
router.post('/adminOrderStatus/:id',adminController.checkLoggedIn,adminController.adminOrderStatus)
router.get('/adminCoupon',adminController.checkLoggedIn,adminController.adminCoupon)
router.post('/adminAddCoupon',adminController.checkLoggedIn,adminController.adminAddCoupon)
router.post('/adminEditCoupon/:id',adminController.checkLoggedIn,adminController.adminEditCoupon)
router.get('/adminDeactivate/:id',adminController.checkLoggedIn,adminController.adminDeactivate)
router.get('/adminActivate/:id',adminController.checkLoggedIn,adminController.adminActivate)
router.get('/adminSalesReport',adminController.checkLoggedIn,adminController.adminSalesReport)
router.post('/adminSalesReportFilter',adminController.checkLoggedIn,adminController.adminSalesReportFilterPost)

module.exports = router;

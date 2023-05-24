var express = require("express");
const adminController = require("../controllers/adminController");
var router = express.Router();
const multer = require("../utils/multer");



/* GET users listing. */
router.get("/", adminController.checkLoggedIn, adminController.adminHome);
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
router.post(
  "/searchUser",
  adminController.checkLoggedIn,
  adminController.searchUser
);
router.get('/order',adminController.checkLoggedIn,adminController.adminOrder)
router.post('/adminOrderStatus/:id',adminController.checkLoggedIn,adminController.adminOrderStatus)


module.exports = router;

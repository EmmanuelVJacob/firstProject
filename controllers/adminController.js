const adminHelper = require("../helpers/adminHelper");
const userHelper = require("../helpers/userHelper");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSID = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountSid, authToken);
const  productHelpers = require('../helpers/productHelper')
const cloudinary = require('../utils/cloudinary')



module.exports = {
  ifLogged: (req, res, next) => {
    if (req.session.adminUser) {
      res.redirect("/admin");
    } else {
      next();
    }
  },
  checkLoggedIn: (req, res, next) => {
    if (req.session.adminUser) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  },
  // adminHome: (req, res) => {
  //   res.render("admin/adminHome", { admin: true });
  // },
  adminLogin: (req, res) => {
    res.render("admin/login", { admin: true });
  },
  adminLoginPost: (req, res) => {
    adminHelper.doLogin(req.body).then((response) => {
      if (response.status == "Invalid User") {
        res.render("admin/login", { emailErr: response.status, admin: true });
      } else if (response.status == "Invalid Password") {
        res.render("admin/login", { passErr: response.status, admin: true });
      } else {
        req.session.adminUser = response.user;
        req.session.adminUserName = response.user.name;
        res.redirect("/admin/");
      }
    });
  },
  adminLogout: (req, res) => {
    req.session.adminUser = null;
    req.session.adminUserName = null;
    // req.session.destroy()
    res.redirect("/admin");
  },
  accounts: async (req, res) => {
    await adminHelper.getUser().then((response) => {
      res.render("admin/accounts", {
        userData: response,
        errMsg: req.session.errMsg,
        userName: req.session.adminUserName,
        admin: true,
      });
    });
  },
  addUser: (req, res) => {
    console.log(req.body);
    // Check if the password and rePassword fields match
    if (req.body.Password !== req.body.rePassword) {
      res.render("admin/addUser", {
        errMsg: "Password does not match",
        admin: true,
      });
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
      res.render("admin/addUser", {
        errMsg: "Mobile number should be 10 digit number",
        admin: true,
      });
      return;
    }
    mob = req.body.mobile;
    userHelper.verifyMobile(mob).then((response) => {
      if (response == "user Exist12") {
        res.render("admin/addUser", { errMsg: response, admin: true });
      } else {

        userHelper
        .userSignup(req.body)
        .then((response) => {
          if (response == "Email already exist !") {
            req.session.errMsg = response;
            res.render("admin/addUser", {
              errMsg: req.session.errMsg,
              admin: true,
            });
          } else {
            res.redirect("/admin/accounts");
          }
        })
        .catch((err) => {
          console.log(err);
        });
      }
    });
  },
  deleteUser: (req, res) => {
    const userId = req.params.id;
    adminHelper
      .deleteUser(userId)
      .then((response) => {
        res.redirect("back");
      })
      .catch((err) => {
        res.redirect("back");
      });
  },
  addProductCategory: (req, res) => {
    const category = req.body.category.toUpperCase();
    productHelpers
      .addProductCategory(category)
      .then(() => {
        res.render("admin/category", {
          userName: req.session.adminUserName,
          errMsg: "Category added",
          category,
          productData,admin:true
        } )       

      })
      .catch(async () => {
        await productHelpers.getProducts().then(async (productData) => {
          productHelpers.getProductCategory().then((category) => {
            res.render("admin/category", {
              userName: req.session.adminUserName,
              errMsg: "Category Exist",
              category,
              productData,admin:true
            });
          });
        });
      });
  },
  deleteProductCategory: (req, res) => {
    const cateId = req.params.id;
    productHelpers
      .deleteProductCategory(cateId)
      .then(() => {
        res.redirect("/admin/categoryPage");
      })
      .catch(() => {
        res.redirect("/admin/categoryPage");
      });
  },
  getProdCategoryToAddProduct: (req, res) => {
    productHelpers.getProductCategory().then((category) => {
      res.render("admin/addProduct", {
        userName: req.session.adminUserName,
        category,admin:true
      });
    });
  },
  addProduct: async (req, res) => {

    const categoryId = await productHelpers.getCategoryId(req.body.category);
    const data = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      categoryId: categoryId._id,
      stock: req.body.stock,
      price: req.body.price,
    };
    productHelpers.addProducts(data)
    .then(
      async (id) => {
      const imgUrls = [];
      try {
        for (let i = 0; i < req.files.length; i++) {
          const result = await cloudinary.uploader.upload(req.files[i].path);
          imgUrls.push(result.url);
        }
        console.log(imgUrls);
        productHelpers
          .addProductImage(id, imgUrls)
          .then(() => {})
          .catch(() => {});
      } catch (err) {
        console.log(`error : ${err}`);
      } finally {
        res.redirect("/admin/product",);
      }
    });
    
  },
  adminProduct: async (req, res) => {
    await adminHelper
      .getProducts()
      .then(async (productData) => {
        await productHelpers.getProductCategory().then((category) => {
          res.render("admin/product", {
            userName: req.session.adminUserName,
            category,
            productData,admin:true
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  },
  editProductGet: (req, res) => {
    const productId = req.params.id;
    productHelpers.getSingleProductDetaile(productId).then((productData) => {
      var images = productData.images
      productHelpers.getProductCategory().then((category) => {
        res.render("admin/editProduct", {
          userName: req.session.adminUserName,
          category,
          productData,admin:true,
          images
        });
      });
    });
  },
  editProduct: async (req, res) => {
    const productId = req.params.id;
    const categoryId = await productHelpers.getCategoryId(req.body.category);
    const data = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      categoryId: categoryId._id,
      stock: req.body.stock,
      price: req.body.price,
    };
    productHelpers.editProduct(productId, data)
    .then(async () => {
      const imgUrls = [];
      try {
        for (let i = 0; i < req.files.length; i++) {
          const result = await cloudinary.uploader.upload(req.files[i].path);
          imgUrls.push(result.url);
        }
        if (imgUrls.length > 0) {
          console.log(productId,'emman');
          productHelpers
            .editProductImage(productId, imgUrls)
            .then(() => {})
            .catch(() => {});
        }
      } catch (err) {
        console.log(`error : ${err}`);
      } finally {
        res.redirect("/admin/product");
      }
    });
  },
  deleteProductImages:(req,res)=>{
    console.log(req.body);
    productHelpers.deleteSingleImage(req.body)
    .then((response)=>{
      res.json(response)
    })
    },
  
  searchProduct: (req, res) => {
    productHelpers
      .searchProduct(req.body.name)
      .then(async (product) => {
        await productHelpers.getProductCategory().then((category) => {
          res.render("admin/product", {
            userName: req.session.adminUserName,
            category,
            productData: product,admin:true
          });
        });
      })
      .catch(async (err) => {
        await productHelpers.getProductCategory().then((category) => {
          res.render("admin/product", {
            userName: req.session.adminUserName,
            category,
            errMsg: err,
          });
        });
      });
  },
  deleteProduct: (req, res) => {
    const productId = req.params.id;
    productHelpers
      .deleteProducts(productId)
      .then(() => {
        res.redirect("back");
      })
      .catch(() => {
        res.redirect("back");
      });
  },
  unlistProduct: (req, res) => {
    const productId = req.params.id;
    productHelpers
      .unlistProducts(productId)
      .then(() => {
        res.redirect("back");
      })
      .catch(() => {
        res.redirect("back");
      });
  },
  listProduct: (req, res) => {
    const productId = req.params.id;
    productHelpers
      .listProducts(productId)
      .then(() => {
        res.redirect("back");
      })
      .catch(() => {
        res.redirect("back");
      });
  },
  categoryPage: async(req,res)=>{
    await productHelpers.getProductCategory().then((category) => {
     res.render("admin/category", {
      admin:true,
       category,
      
     });
   });
  },
  deleteProductCategory: (req, res) => {
    const cateId = req.params.id;
    productHelpers
      .deleteProductCategory(cateId)
      .then(() => {
        res.redirect("back");
      })
      .catch(() => {
        res.redirect("back");
      });
  },
  listCategory:(req,res)=>{
    const cateId = req.params.id;
    productHelpers
      .listCategory(cateId)
      .then(() => {
        res.redirect("back");
      })
      .catch(() => {
        res.redirect("back");
      });
  },
  blockUser: (req, res) => {
    userId = req.params.id;
    adminHelper.blockUser(userId).then(() => {
      req.session.userLoggedIn = false;
      req.session.user = false;
      req.session.userName = false;
      res.redirect("/admin/accounts");
    });
  },
  UnBlockUser: (req, res) => {
    userId = req.params.id;
    console.log(userId);
    adminHelper.UnBlockUser(userId).then(() => {
      res.redirect("/admin/accounts");
    });
  },
  searchUser: (req, res) => {
    adminHelper
      .searchUser(req.body.name)
      .then((userData) => {
        res.render("admin/accounts", { userData ,admin:true});
      })
      .catch((err) => {
        res.render("admin/accounts", { errMsg: err,admin:true });
      });
  },
  adminOrder:(req,res)=>{
    adminHelper.getUserOrder().then((adminOrder)=>{
      res.render('admin/adminOrder',{admin:true,adminOrder})
    })
  },
  adminOrderStatus:(req,res)=>{
    const orderId = req.params.id
    const  status = req.body.status
    adminHelper.adminOrderStatus(orderId,status).then(()=>{
      res.redirect('back')
    })
  },
  adminCoupon:async(req,res)=>{
    const coupons = await adminHelper.getCoupon();
    coupons.forEach(coupon => {
      coupon.deactivate = coupon.status === 'Deactivated'?true:false;
      coupon.expired = coupon.status === 'Expired'?true:false;
    });
    res.render('admin/adminCoupon',{admin:true,coupons})
  },
  adminAddCoupon:(req,res)=>{
    adminHelper.adminAddCoupon(req.body).then(()=>{
      res.redirect('/admin/adminCoupon')
    }).catch(()=>{
      res.redirect('/admin/adminCoupon')
    })
  },
  adminEditCoupon:(req, res)=> {
    const couponId = req.params.id; 
    adminHelper.adminEditCoupon(couponId, req.body).then(()=> {
        res.redirect('/admin/adminCoupon')
    })
},
  adminDeactivate:(req, res)=> {
    const couponId = req.params.id;
    adminHelper.deactivateoCupon(couponId).then(()=> {
        res.redirect('/admin/adminCoupon')
    }).catch(()=> {
        res.redirect('/admin/adminCoupon')
    })
},
adminActivate:(req, res)=> {
  const couponId = req.params.id;
  adminHelper.activateCoupon(couponId).then(()=> {
      res.redirect('/admin/adminCoupon')
  }).catch(()=> {
      res.redirect('/admin/adminCoupon');
  })
},
  adminPanel: async (req, res) => {

    const jan = await adminHelper.getMonthCount(1,2023)
    const feb = await adminHelper.getMonthCount(2,2023)
    const mar = await adminHelper.getMonthCount(3,2023)
    const apr = await adminHelper.getMonthCount(4,2023)
    const may = await adminHelper.getMonthCount(5,2023)
    const jun = await adminHelper.getMonthCount(6,2023)
    const userCount =await adminHelper.getUsersCount()
    const total = await adminHelper.getLastMonthTotal()
    const totalOrdersPlaced = await productHelpers.totalOrdersPlaced()
    let totalEarnings = 0;
    totalEarnings = await adminHelper.getOrderTotalPrice();
    const deliveredCounts = await adminHelper.getAllDeliveredOrdersCount();
    const placedCounts = await adminHelper.getAllPlacedOrdersCount();
    const cancelledCounts = await adminHelper.getAllCanceldOrdersCount();
    const returnCounts = await adminHelper.getAllReturnOrdersCount();
    console.log(returnCounts,'return Count');
    // const topProducts = await adminHelpers.getTopProduct();
    res.render('admin/adminHome', {admin: true, deliveredCounts , placedCounts, cancelledCounts, returnCounts, userCount, totalOrdersPlaced, total, totalEarnings, jan,feb,mar,apr,may,jun});
},

adminSalesReport: async (req, res) => {
  const deliveredOrders = await adminHelper.getAllDeliveredOrders();

  let totalEarnings = 0;
  totalEarnings = await adminHelper.getOrderTotalPrice();

  deliveredOrders.forEach(eachOrder => {
      eachOrder.productCount = eachOrder.products.length;

      // date formatting
      const newDate = new Date(eachOrder.date);
      const year = newDate.getFullYear();
      const month = newDate.getMonth() + 1;
      const day = newDate.getDate();
      const formattedDate = `${day < 10 ? '0' + day : day}-${month < 10 ? '0' + month : month}-${year}`;
      eachOrder.date = formattedDate;
    });
    res.render('admin/adminSalesReport', {admin: true,  deliveredOrders, totalEarnings})
},
adminSalesReportFilterPost:(req, res) => {
  const dateFrom = req.body.date[0]
  const dateTo = req.body.date[1]
  adminHelper.filterDate(req.body.date).then((filteredOrders) => {

      let totalEarnings = 0;
      if(filteredOrders.length >=1 ){
          filteredOrders.forEach(eachOrder => {
              eachOrder.productCount = eachOrder.item.length;
              totalEarnings += eachOrder.total;

              // date formatting
              const newDate = new Date(eachOrder.date);
              const year = newDate.getFullYear();
              const month = newDate.getMonth() + 1;
              const day = newDate.getDate();
              const formattedDate = `${day < 10 ? '0' + day : day}-${month < 10 ? '0' + month : month}-${year}`;
              eachOrder.date = formattedDate;
          });
      }else{
          filteredOrders = false;
      }
      res.render('admin/adminSalesReport', {admin: true, deliveredOrders:filteredOrders, totalEarnings,dateFrom,dateTo});
  })
},
refund:async(req,res)=>{
  orderId = req.params.id
  let orderDetails = await  productHelpers.getOrderDetails(orderId)
  adminHelper.refund(orderDetails)
  res.redirect('/admin/order')
}

};

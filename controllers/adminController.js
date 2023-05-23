const adminHelper = require("../helpers/adminHelper");
const userHelper = require("../helpers/user-helper");
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
  adminHome: (req, res) => {
    res.render("admin/adminHome", { admin: true });
  },
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
    console.log(productHelpers);
    productHelpers
      .deleteProducts(productId)
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
};

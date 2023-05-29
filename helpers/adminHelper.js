const adminController = require("../controllers/adminController");
var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb-legacy");
const { response } = require("express");

module.exports = {
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      const response = {};
      const user = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        if (userData.password == user.password) {
          response.user = user;
          resolve(response);
        } else {
          response.status = "Invalid Password";
          resolve(response);
        }
      } else {
        response.status = "Invalid User";
        resolve(response);
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      const response = {};
      const user = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        if (userData.password == user.password) {
          response.user = user;
          resolve(response);
        } else {
          response.status = "Invalid Password";
          resolve(response);
        }
      } else {
        response.status = "Invalid User";
        resolve(response);
      }
    });
  },
  getUser: () => {
    return new Promise(async (resolve, reject) => {
      const userData = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(userData);
    });
  },
  deleteUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .deleteOne({ _id: new ObjectId(userId) })
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getProducts: () => {
    return new Promise(async (resolve, reject) => {
      const productData = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      if (productData) {
        resolve(productData);
      } else {
        resolve("No data to show");
      }
    });
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      userId = new ObjectId(userId);
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: userId });
      if (user.status == true) {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne({ _id: userId }, { $set: { status: false } })
          .then((response) => {
            resolve(response);
          })
          .catch(() => {
            reject();
          });
      }
    });
  },
  UnBlockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      userId = new ObjectId(userId);
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: userId });
      if (user.status == false) {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne({ _id: userId }, { $set: { status: true } })
          .then((response) => {
            resolve(response);
          })
          .catch(() => {
            reject();
          });
      }
    });
  },
  searchUser: (search) => {
    return new Promise(async (resolve, reject) => {
      const userData = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find({ name: { $regex: new RegExp(search), $options: "i" } })
        .toArray()
        .then((userData) => {
          resolve(userData);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getUserOrder: () => {
    return new Promise(async (resolve, reject) => {
      const userOrders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .sort({ date: -1 })
        .toArray();
      resolve(userOrders);
    });
  },
  adminOrderStatus: (orderId, status) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          {
            _id: new ObjectId(orderId),
          },
          {
            $set: {
              status: status,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getCoupon: () => {
    return new Promise(async (resolve, reject) => {
      const coupons = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      const newDate = new Date();
      coupons.forEach((coupon) => {
        if (coupon.date < newDate) {
          coupon.status = "Expired";
        }
        const date = coupon.date;
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // add 1 because months are zero-indexed
        const day = date.getDate();
        const formattedDate = `${day < 10 ? "0" + day : day}-${
          month < 10 ? "0" + month : month
        }-${year}`;
        coupon.date = formattedDate;
      });
      resolve(coupons);
    });
  },
  adminAddCoupon: (coupon) => {
    return new Promise(async (resolve, reject) => {
      coupon.discount = Number(coupon.discount);
      coupon.date = new Date(coupon.date);
      coupon.status = true;
      const newDate = new Date();

      if (coupon.date < newDate) {
        coupon.status = "Expired";
      }

      const couponExist = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({
          code: coupon.code,
        });
      if (couponExist) {
        resolve(null);
      } else {
        db.get()
          .collection(collection.COUPON_COLLECTION)
          .insertOne(coupon)
          .then(() => {
            resolve();
          });
      }
    });
  },
};

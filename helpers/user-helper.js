var db = require("../config/connection");
var collection = require("../config/collections");
// var collection = require("../config/twilio");
var bcrypt = require("bcrypt");
const crypto = require("crypto");
const { response } = require("express");
const Razorpay = require("razorpay");
const { promiseHooks } = require("v8");
const { resolve } = require("path");
const { rejects } = require("assert");
const objectId = require("mongodb-legacy").ObjectId;
const razorpay_key_id = process.env.RAZORPAY_KEY_ID;
const razorpay_key_secret = process.env.RAZORPAY_KEY_SECRET;

var instance = new Razorpay({
  key_id: razorpay_key_id,
  key_secret: razorpay_key_secret,
});

module.exports = {
  verifyMobile: (mob) => {
    return new Promise(async (resolve, reject) => {
      mobExist = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: mob });
      let response = {};
      if (mobExist) {
        if (mobExist.status === false) {
          response = "User Blocked";
          resolve(response);
        } else {
          response = "user Exist";

          resolve(response);
        }
      } else {
        resolve("No user found");
      }
    });
  },
  userSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      const findUserDetail = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (findUserDetail) {
        resolve("Email already  !");
      } else {
        Object.assign(userData, { status: true });
        userData.Password = await bcrypt.hash(userData.Password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      const response = {};
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        if (user.status === false) {
          response.status = "User Blocked";
          resolve(response);
        }
        bcrypt.compare(userData.password, user.Password).then((status) => {
          if (status) {
            response.user = user;
            resolve(response);
          } else {
            response.status = "Invalid Password";
            resolve(response);
          }
        });
      } else {
        response.status = "Invalid User";
        resolve(response);
      }
    });
  },
  getAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      const userAddress = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({
          _id: new objectId(userId),
        });
      try {
        const addresses = userAddress.address;
        resolve(addresses);
      } catch {
        resolve("No addresses added");
      }
    });
  },
  addAddress: (address, userId) => {
    return new Promise((resolve, reject) => {
      address.phone = Number(address.phone);
      address.postCode = Number(address.postCode);
      userId = new objectId(userId);
      address._id = new objectId();
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          {
            _id: new objectId(userId),
          },
          {
            $push: { address: address },
          }
        );
    });
  },
  editAddress: (info, userId, address) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          {
            _id: new objectId(userId),
            "address._id": new objectId(address),
          },
          {
            $set: {
              "address.$.state": info.state,
              "address.$.name": info.name,
              "address.$.phone": Number(info.phone),
              "address.$.address": info.address,
              "address.$.city": info.city,
              "address.$.postCode": info.postCode,
              "address.$.type": info.type,
            },
          }
        );
    });
  },
  deleteAddress: (addressId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          {
            _id: new objectId(userId),
            "address._id": new objectId(addressId),
          },
          {
            $pull: { address: { _id: new objectId(addressId) } },
          }
        );
    });
  },
  findAddress: (addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      const address = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          { $match: { _id: new objectId(userId) } },
          { $unwind: "$address" },
          { $match: { "address._id": new objectId(addressId) } },
          { $project: { _id: 0, address: 1 } },
        ])
        .toArray();
      resolve(address[0].address);
    });
  },
  addOrderDetails: (order, userId) => {
    return new Promise(async (resolve, reject) => {
      delete order.coupon;
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(order)
        .then(async (response) => {
          resolve(response);
          for (let i = 0; i < order.item.length; i++) {
            const stock = await db
              .get()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                {
                  _id: order.item[i].product._id,
                },
                {
                  $inc: {
                    stock: -order.item[i].quantity,
                  },
                }
              );
          }
        });
    }).catch((err) => {
      reject(err);
    });
  },
  getOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      userId = new objectId(userId);
      const orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: userId })
        .sort({ date: -1 })
        .toArray();
      resolve(orders);
    });
  },
  getOrderedProducts: (ordersId) => {
    return new Promise(async (resolve, reject) => {
      ordersId = new objectId(ordersId);
      const orders1 = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ _id: ordersId })
        .toArray();
      resolve(orders1);
    });
  },
  deleteOrder: (ordersId) => {
    return new Promise((resolve, reject) => {
      const orderId = new objectId(ordersId);
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          {
            _id: orderId,
          },
          {
            $set: {
              status: "cancelled",
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  returnProduct: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          {
            _id: new objectId(orderId),
          },
          {
            $set: {
              status: "Return",
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      total = Number(total).toFixed(0);
      orderId = String(orderId);
      instance.orders.create(
        {
          amount: parseInt(total) * 100,
          currency: "INR",
          receipt: orderId,
        },
        (err, order) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(order);
          }
        }
      );
    });
  },
  verifyPayment:(details)=>{
    return new Promise((resolve, reject)=>{            
        let hmac = crypto.createHmac('sha256', razorpay_key_secret);
         
        hmac.update(details.response.razorpay_order_id + '|' + details.response.razorpay_payment_id);
        hmac = hmac.digest('hex');
        if(hmac===details.response.razorpay_signature){
            resolve();
        }else{
            reject();
        }
    });
},

  changeOrderStatus:(orderId) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection.ORDER_COLLECTION).updateOne(
            {
                _id: new objectId(orderId)
            },
            {
                $set: {
                    status: "placed"
                }
            }
        ).then((response) => {
            resolve(response)
        }).catch((err) => {
            
            console.log(err);
        })
    })
},
};

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
      try {
        const coupons = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .find()
          .toArray();
        
        const currentDate = new Date();
        
        const updatedCoupons = coupons.map((coupon) => {
          const couponDate = new Date(coupon.date);
          
          if (couponDate < currentDate) {
            coupon.status = "Expired";
          }
          
          const year = couponDate.getFullYear();
          const month = couponDate.getMonth() + 1; // add 1 because months are zero-indexed
          const day = couponDate.getDate();
          const formattedDate = `${day < 10 ? "0" + day : day}-${
            month < 10 ? "0" + month : month
          }-${year}`;
          
          coupon.date = formattedDate;
          
          return coupon;
        });
        
        resolve(updatedCoupons);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  adminAddCoupon: (coupon) => {
    return new Promise(async (resolve, reject) => {
      coupon.discount = Number(coupon.discount);
      coupon.date = new Date(coupon.date);
      coupon.status = 'Activated';
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
  
  adminEditCoupon:(couponId, coupon)=> {
    return new Promise((resolve, reject)=> {

        coupon.data = new Date(coupon.data);
        coupon.status = true;
        const newDate = new Date();
        if(coupon.date < newDate){
            coupon.status = 'Expired';
        }
        db.get().collection(collection.COUPON_COLLECTION).updateOne(
            {
                _id: new ObjectId(couponId)
            },

            {
                $set: {
                    code: coupon.code,
                    discount: Number(coupon.discount),
                    description: coupon.description,
                    date: coupon.date,
                    status: coupon.status
                }
            }
        ).then(()=> {
            resolve()
        }).catch(()=> {
            reject();
        })

    })
  },
  deactivateoCupon:(couponId)=> {
    return new Promise((resolve, reject)=> {

        db.get().collection(collection.COUPON_COLLECTION).updateOne(
            {
                _id: new ObjectId(couponId)
            },
            {
                $set: {
                    status:'Deactivated'
                }
            }
        ).then(()=> {
            resolve();
        }).catch(()=> {
            reject();
        })
    })
  },
  activateCoupon:(couponId)=> {

    return new Promise((resolve, reject)=> {

        db.get().collection(collection.COUPON_COLLECTION).updateOne(
            {
                _id: new ObjectId(couponId)
            },
            {
                $set: {
                    status: 'Activated'
                }
            }
        ).then(()=> {
            resolve();
        }).catch(()=> {
            reject();
        })
    })
  },
  getMonthCount:(month,year)=>{
    return new Promise(async(resolve,reject)=>{
      try{
        const startDate = new Date(year,month - 1,1);
        const endDate = new Date(year,month,0);
        const count = await db.get().collection(collection.ORDER_COLLECTION)
        .countDocuments({
          status:"Delivered",
          date: {$gte:startDate,$lte:endDate}
        });
        resolve(count);
      }catch(err){
        reject(err)
      }
      
    })
  },
  getUsersCount:() => {
    return new Promise((resolve, reject)=> {
        const users = db.get().collection(collection.USER_COLLECTION).countDocuments({})
        resolve(users);
    })
  },
  getLastMonthTotal:()=> {
    return new Promise( async (resolve, reject) => {

        try{
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth()-1);

            const total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: 'Delivered',
                        date: { $gte: lastMonth}
                    }
                },
                {
                    $group: {
                        _id: 0,
                        total: { $sum: {$toDouble: '$total'}}
                    }
                }
            ]).toArray();
            if(total.length > 0) {
                resolve(total[0].total);
            }else{
                resolve(0);
            }
        }catch(err){
            reject(err)
        }
    })
  },

  getOrderTotalPrice:() => {
    return new Promise( async (resolve, reject) => {
        const totalOrderPrice = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match: {
                    status: 'Delivered'
                }
            },
            {
                $group: {
                    _id: 0,
                    total: { $sum: {$toDouble: '$total'}}
                }
            }
        ]).toArray();

        if(totalOrderPrice.length > 0) {
            resolve(totalOrderPrice[0].total);
        }else{
            resolve(0);
        }
    })
  },
  getAllDeliveredOrders: ()=> {
    return new Promise(async (resolve, reject) => {
        const deliveredOrders = await db.get().collection(collection.ORDER_COLLECTION).find(
            {
                status: "Delivered"
            }
        ).toArray();
        resolve(deliveredOrders);
    })
  },

  filterDate:(dates)=> {
    return new Promise(async(resolve, reject) => {

        let newDate = [];
        dates.forEach(eachDate => {
            const date = new Date(eachDate);
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // add 1 because months are zero-indexed
            const day = date.getDate();
            const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
            newDate.push(formattedDate);
        });

        const report = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match: {
                    status: "Delivered",
                    date: {
                        $gte: new Date(newDate[0]),
                        $lte: new Date(newDate[1])
                    }
                }
            }
        ]).toArray();
        resolve(report);
    })
  },

  getAllDeliveredOrdersCount:()=> {
    return new Promise((resolve, reject)=> {

        db.get().collection(collection.ORDER_COLLECTION).find(
            {
                status: 'Delivered'
            }
        ).count({}).then((count) => {
            resolve(count);
        }).catch((err)=> {
            reject(err);
        });
    });
  },
  getAllPlacedOrdersCount:()=> {
    return new Promise((resolve, reject) => {

        db.get().collection(collection.ORDER_COLLECTION).find(
            {
                status:'placed'
            }
        ).count({}).then((count)=> {
            resolve(count);
        }).catch((err) => {
            reject(err);
        })
    })
  },

  getAllCanceldOrdersCount:()=> {
    return new Promise((resolve, reject) => {

        db.get().collection(collection.ORDER_COLLECTION).find(
            {
                status:'Cancelled'
            }
        ).count({}).then((count)=> {
            resolve(count);
        }).catch((err) => {
            reject(err);
        })
    })
  },

  getAllReturnOrdersCount:()=> {
    return new Promise((resolve, reject) => {
        db.get().collection(collection.ORDER_COLLECTION).find(
            {
                status:'Return'
            }
        ).count({}).then((count)=> {
            resolve(count);
        }).catch((err) => {
            reject(err);
        })
    })
  },
  filterDate:(dates)=> {
    return new Promise(async(resolve, reject) => {

        let newDate = [];
        dates.forEach(eachDate => {
            const date = new Date(eachDate);
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // add 1 because months are zero-indexed
            const day = date.getDate();
            const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
            newDate.push(formattedDate);
        });

        const report = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match: {
                    status: "Delivered",
                    date: {
                        $gte: new Date(newDate[0]),
                        $lte: new Date(newDate[1])
                    }
                }
            }
        ]).toArray();
        resolve(report);
    })
  },
  refund: (orderDetail) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          {
            _id: new ObjectId(orderDetail._id),
          },
          {
            $set: {
              refund: true,
            },
          }
        )
        .then(async (response) => {
          const currentDate = new Date().toISOString();
          const source = orderDetail.reasons
          const orderId = new ObjectId(orderDetail._id)
          const amount = parseInt(orderDetail.total)
          const userWalletExist = await db
            .get()
            .collection(collection.WALLET_COLLECTION)
            .findOne({ userId: new ObjectId(orderDetail.userId) });
          if (userWalletExist) {
            db.get()
              .collection(collection.WALLET_COLLECTION)
              .updateOne(
                { userId: new ObjectId(orderDetail.userId) },
                {
                  $inc: { bal: amount },
                  $push: {
                    data: {
                      orderId: orderId,
                      date: currentDate,
                      reasons: source,
                      transAmt: amount
                    }
                  }
                }
              );
          } else {
            db.get()
              .collection(collection.WALLET_COLLECTION)
              .insertOne({
                userId: new ObjectId(orderDetail.userId),
                bal: amount,
                data: [
                  {
                    orderId: orderId,
                    date: currentDate,
                    reasons: source,
                    transAmt: amount
                  }
                ]
              });
          }
          resolve(response);
        });
    });
  },
};

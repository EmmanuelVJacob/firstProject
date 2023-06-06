const adminController = require('../controllers/adminController')
var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb-legacy");
const { response } = require('express');
const { json } = require('body-parser');

module.exports = {
    addProductCategory: (category) => {
        return new Promise(async (resolve, reject) => {
          const categoryExist = await db
            .get()
            .collection(collection.CATEGORY_COLLECTION)
            .findOne({ category: category });
          if (categoryExist) {
            reject("Category Exist");
          } else {
            db.get()
              .collection(collection.CATEGORY_COLLECTION)
              .insertOne({ category: category , listed:true})
              .then(() => {
                resolve();
              })
              .catch(() => {
                reject();
              });
          }
        });
      },
      deleteProductCategory: (cateId) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.CATEGORY_COLLECTION)
            .updateOne({ _id: new objectId(cateId)}, {$set:{listed:false} })
            .then(async(response) => {
              await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({categoryId:  new objectId(cateId)},{$set:{listed:false}})
              resolve();
            })
            .catch(() => {
              reject();
            });
        });
      },
      getProductCategory: () => {
        return new Promise(async (resolve, reject) => {
          const category = await db
            .get()
            .collection(collection.CATEGORY_COLLECTION)
            .find()
            .toArray();
          resolve(category);
        });
      },
      getCategoryId: (category) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.CATEGORY_COLLECTION)
            .findOne({ category: category })
            .then((response) => { resolve(response) })
        })
      },
      addProducts: (product) => {
        return new Promise((resolve, reject) => {
          product.price = Number(product.price);
          product.stock = Number(product.stock);
          Object.assign(product, { listed: true });
          db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product)
          .then((data) => {
            resolve(data.insertedId);
          })
        })
      },
      getSingleProductDetaile: (productId) => {
        return new Promise(async (resolve, reject) => {
          db.get().collection(collection.PRODUCT_COLLECTION).find(
            { _id: new ObjectId(productId) }
          ).toArray()
            .then((response) => {
              resolve(response)
            })
            .catch((err) => {
              reject(err)
            })
        })
      },
      editProduct: (productId, data) => {
        return new Promise((resolve, reject) => {
          productId = new ObjectId(productId)
          db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              {
                _id: productId
              },
              {
                $set: {
                  name: data.name,
                  category: data.category,
                  categoryId: data.categoryId,
                  description: data.description,
                  price: Number(data.price),
                  stock: Number(data.stock),
                  listed: true
                }
              }
              
            ).then((response) => {
              resolve(productId)
            }).catch((err) => {
              reject();
            })
        })
      },
      editProductImage: (id, imgUrls) => {
        return new Promise((resolve, reject) => {
          for (let i = 0; i < imgUrls.length; i++) {
            db.get().collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                {
                  _id: new ObjectId(id)
                },
                {
                  $push: {
                    images: imgUrls[i]
                  }
                }
              ).then((response) => {
                if (i == imgUrls.length) {
                  resolve()
                }
              }).catch((err) => {
                reject()
              })
          }
        })
      },
      searchProduct: (search) => {
        return new Promise(async (resolve, reject) => {
          await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ name: { $regex: new RegExp(search), $options: "i" } })
            .toArray()
            .then((productData) => {
              resolve(productData);
            })
            .catch((err) => {
              reject(err);
            });
        });
      },
      getProducts: (currentPage) => {
        return new Promise(async (resolve, reject) => {
          currentPage = parseInt(currentPage);
          const limit = 6;
          const skip = (currentPage - 1) * limit;
          const productData = await db.get().collection(collection.PRODUCT_COLLECTION).find({listed:true}).skip(skip).limit(limit).toArray();
          if (productData) {
            resolve(productData);
          } else {
            resolve("No data to show")
          }
        })
      },
      deleteProducts: (productId) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
            {
              _id: new ObjectId(productId)
            },
            {
              $set: {
                listed: false,
                stock: 0
              }
            }
          )
            .then((response) => {
              resolve()
            })
            .catch((err) => {
              reject()
            })
        })
      },
      unlistProducts: (productId) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
            {
              _id: new ObjectId(productId)
            },
            {
              $set: {
                listed: false,
               
              }
            }
          )
            .then((response) => {
              resolve()
            })
            .catch((err) => {
              reject()
            })
        })
      },
      listProducts: (productId) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
            {
              _id: new ObjectId(productId)
            },
            {
              $set: {
                listed: true,
               
              }
            }
          )
            .then((response) => {
              resolve()
            })
            .catch((err) => {
              reject()
            })
        })
      },
      deleteProductCategory: (cateId) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.CATEGORY_COLLECTION)
            .updateOne({ _id: new ObjectId(cateId)}, {$set:{listed:false} })
            .then(async(response) => {
              await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({categoryId:  new ObjectId(cateId)},{$set:{listed:false}})
              resolve();
            })
            .catch(() => {
              reject();
            });
        });
      },
      listCategory:(cateId) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.CATEGORY_COLLECTION)
            .updateOne({ _id: new ObjectId(cateId)}, {$set:{listed:true} })
            .then(async(response) => {
              await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({categoryId:  new ObjectId(cateId)},{$set:{listed:true}})
              resolve();
            })
            .catch(() => {
              reject();
            });
        });
      },
      getProducts: (currentPage) => {
        return new Promise(async (resolve, reject) => {
          currentPage = parseInt(currentPage);
          const limit = 3;
          const skip = (currentPage-1)*limit;
          console.log(currentPage,'current');
          console.log(limit,'linim');
          console.log(skip,'skip');
          const productData = await db.get().collection(collection.PRODUCT_COLLECTION).find({listed:true}).skip(skip).limit(limit).toArray();
          if (productData) {
            resolve(productData);
          } else {
            resolve("No data to show")
          }         
        })
      },
      totalPages:()=> {
        return new Promise(async (resolve, reject) => {
            const products = await db.get().collection(collection.PRODUCT_COLLECTION).find({listed:true}).toArray()
            const totalCount = products.length
            resolve(totalCount);
        })
      },
      totalcategoryproducts:()=> {
        return new Promise(async (resolve, reject) => {
            const products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ listed: true, category:CategoryID }).toArray()
            const totalCount = products.length
            resolve(totalCount);
        })
      },
      
      


      addProductImage: (id, imgUrls) => {
        return new Promise((resolve, reject) => {
          db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              {
                _id: id
              },
              {
                $set: {
                  images: imgUrls
                }
              }
            )
            .then((response) => {
              resolve();
            })
            .catch((err) => {
              reject()
            })
        })
      },
      getSingleProduct: (productId) => {
        return new Promise(async (resolve, reject) => {
          if (!ObjectId.isValid(productId)) {
            return reject('Invalid product ID');
          }
      
          const productSingleData = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({
            _id: new ObjectId(productId)
          });
          resolve(productSingleData);
        });
      },
      deleteSingleImage:(data)=>{
        const productId=data.productId
        const imgUrl=data.imgUrl
    
        return new Promise((resolve,reject)=>{
          try{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
              {
                _id:new ObjectId(productId)
              },
              {
                $pull:{images:imgUrl}
              }
            ).then((response)=>{
              resolve(response)
            })
          }catch(err){
            console.log(err);
          }
        })
      },
      getCategoryWiseProducts: (CategoryID,currentPage) => {
        console.log(CategoryID);
        return new Promise(async (resolve, reject) => {
          currentPage = parseInt(currentPage);
          const limit = 3;
          const skip = (currentPage-1)*limit;
          const productData = await db.get().collection(collection.PRODUCT_COLLECTION).find({ listed: true, category:CategoryID }).skip(skip).limit(limit).toArray();
          if (productData.length > 0) {
            resolve(productData);
          } else {
            resolve([]);
          }
        });
      },
      totalOrdersPlaced:() => {
        return new Promise (async (resolve, reject) => {
            try{
                const orderPlacedCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({});
                resolve(orderPlacedCount);
            }catch{
                resolve(0)
            }
        })
      },
      
}







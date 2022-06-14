/* eslint-disable no-async-promise-executor */
const db = require('../config/connection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {

  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      const response = {}
      const admin = await db.get().collection('main').findOne({ user: adminData.user })// user> field name

      if (admin) {
        bcrypt.compare(adminData.password, admin.password).then((status) => {
          if (status) {
            console.log('success')

            response.admin = admin

            response.status = true
            // console.log(response+"rrrrrr");
            resolve(response)
          } else {
            console.log('failed')
            resolve(status)
          }
        })
      } else {
        console.log('failed')
        resolve({ status: false })
      }
    })
  },

  getAllUser: () => {
    return new Promise(async (resolve, reject) => {
      const viewuser = await db.get().collection('main').find({ role: 'user' }).toArray()
      resolve(viewuser)
    })
  },

  deleteUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection('main').deleteOne({ _id: ObjectId(userId) }).then((response) => {
        resolve(response)
      })
    })
  },

  blockUsers: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection('main').updateOne({ _id: ObjectId(userId) },
        { $set: { isActive: false } }).then((response) => {
        resolve(response)
      })
    })
  },

  unblockUsers: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection('main').updateOne({ _id: ObjectId(userId) },
        { $set: { isActive: true } }).then((response) => {
        resolve(response)
      })
    })
  },
  getAllVendor: () => {
    return new Promise(async (resolve, reject) => {
      const viewvendor = await db.get().collection('main').find({ role: 'vendor' }).toArray()
      // console.log(viewvendor);
      resolve(viewvendor)
    })
  },
  blockVendor: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection('main').updateOne({ _id: ObjectId(userId) },
        { $set: { isActive: false } }).then((response) => {
        resolve(response)
      })
    })
  },

  unblockVendors: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection('main').updateOne({ _id: ObjectId(userId) },
        { $set: { isActive: true } }).then((response) => {
        resolve(response)
      })
    })
  },

  deleteVendor: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection('main').deleteOne({ _id: ObjectId(userId) }).then((response) => {
        resolve(response)
      })
    })
  },

  acceptVendor: (vendorId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection('main').updateOne({ _id: ObjectId(vendorId) },
        { $set: { isAccept: 'Accepted' } }).then((response) => {
        resolve(response)
      })
    })
  },
  rejectVendor: (vendorId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection('main').updateOne({ _id: ObjectId(vendorId) },
        { $set: { isAccept: 'Rejected' } }).then((response) => {
        resolve(response)
      })
    })
  },
  userBooked: () => {
    return new Promise(async (resolve) => {
      const fullBooking = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$bookingdetails'
            }
          },
          {
            $match:
                {
                  role: 'user',

                  'bookingdetails.status': { $in: ['Pay at hotel', 'Cancelled', 'Paid online'] }
                }

          }
        ])
        .toArray()
      console.log(fullBooking)
      resolve(fullBooking)
    })
  },

  dashboardTableAdmin: (vendorId) => {
    return new Promise(async (resolve) => {
      const tableData = await db.get().collection('main').aggregate(
        [
          {
            $unwind: {
              path: '$bookingdetails'
            }
          }, {
            $match: {
              'bookingdetails.status': {
                $in: [
                  'Pay at hotel', 'Cancelled', 'Paid online'
                ]
              }
            }
          }, {
            $group: {
              _id: {

                bookingdate: '$bookingdetails.currentdate'
              },
              total: {
                $sum: '$bookingdetails.total'
              }
            }
          }
        ]
      ).toArray()
      console.log(tableData)

      resolve(tableData)
    })
  },
  totalEarning: () => {
    return new Promise(async (resolve) => {
      const earning = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$bookingdetails'
            }
          },
          {
            $match: {
              $and: [
                {
                  role: 'user'
                },
                {
                  'bookingdetails.status': {
                    $in: ['Pay at hotel', 'Paid online']
                  }
                }
              ]
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: '$bookingdetails.total'
              }
            }
          }
        ])
        .toArray()

      resolve(earning)
    })
  },
  totalBooking: () => {
    return new Promise(async (resolve) => {
      const totalCount = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$bookingdetails'
            }
          },
          {
            $match: {
              $and: [
                {
                  role: 'user'
                },
                {
                  'bookingdetails.status': {
                    $in: ['Pay at hotel', 'Paid online']
                  }
                }
              ]
            }
          }
        ])
        .toArray()

      resolve(totalCount.length)
    })
  },
  onlineBookingCount: () => {
    return new Promise(async (resolve) => {
      const onlineCount = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$bookingdetails'
            }
          },
          {
            $match: {
              $and: [
                { 'bookingdetails.status': 'Paid online' },
                {
                  role: 'user'
                }
              ]
            }
          },
          {
            $count: 'onlinecount'
          }
        ])
        .toArray()
      console.log(onlineCount)
      resolve(onlineCount)
    })
  },
  offlineBookingCount: () => {
    return new Promise(async (resolve) => {
      const offlineCount = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$bookingdetails'
            }
          },
          {
            $match: {
              $and: [
                { 'bookingdetails.status': 'Pay at hotel' },
                {
                  role: 'user'
                }
              ]
            }
          },
          {
            $count: 'offlinecount'
          }
        ])
        .toArray()
      resolve(offlineCount)
    })
  },
  totalOnlineEarning: () => {
    return new Promise(async (resolve) => {
      const onlineEarning = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$bookingdetails'
            }
          },
          {
            $match: {
              $and: [
                {
                  role: 'user'
                },
                {
                  'bookingdetails.status': {
                    $in: ['Paid online']
                  }
                }
              ]
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: '$bookingdetails.total'
              }
            }
          }
        ])
        .toArray()

      resolve(onlineEarning)
    })
  },
  totalOfflineEarning: () => {
    return new Promise(async (resolve) => {
      const offlineEarning = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$bookingdetails'
            }
          },
          {
            $match: {
              $and: [
                {
                  role: 'user'
                },
                {
                  'bookingdetails.status': {
                    $in: ['Pay at hotel']
                  }
                }
              ]
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: '$bookingdetails.total'
              }
            }
          }
        ])
        .toArray()

      resolve(offlineEarning)
    })
  }

}

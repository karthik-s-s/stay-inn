/* eslint-disable no-async-promise-executor */
const db = require('../config/connection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
  doSignup: (vendorData) => {
    return new Promise(async (resolve, reject) => {
      const check = await db
        .get()
        .collection('main')
        .findOne({ email: vendorData.email })

      if (check) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject()
      } else {
        vendorData.password = await bcrypt.hash(vendorData.password, 10)
        vendorData.role = 'vendor'
        vendorData.isAccept = 'Pending'

        vendorData.isActive = true
        db.get()
          .collection('main')
          .insertOne(vendorData)
          .then((data) => {
            resolve(vendorData)
          })
      }
    })
  },

  doLogin: (vendorData) => {
    return new Promise(async (resolve, reject) => {
      // const loginStatus = false
      const response = {}
      const vendor = await db
        .get()
        .collection('main')
        .findOne({ user: vendorData.user })

      if (vendor) {
        bcrypt.compare(vendorData.password, vendor.password).then((status) => {
          if (status) {
            console.log('success')

            response.vendor = vendor // sta vendor
            response.status = true

            // console.log(response);
            resolve(response)
          } else {
            console.log('failed')
            resolve({ status: false })
          }
        })
      } else {
        resolve({ status: false })
      }
    })
  },
  addroom: (roomData, hotelId) => {
    return new Promise(async (resolve, reject) => {
      const [a, b, c] = roomData.type
      const i = hotelId + a + b + c
      roomData.roomId = i // room id created
      roomData.isAvailable = true

      await db
        .get()
        .collection('main')
        .updateOne(
          { _id: ObjectId(hotelId) },
          {
            $push: {
              rooms: roomData
            }
          },
          { upsert: true }
        )
        .then((data) => {
          data.roomId = roomData.roomId // id of room in status
          resolve(data)
        })
    })
  },

  getRoomDet: (vendorId) => {
    return new Promise(async (resolve, reject) => {
      const roomsDet = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$rooms'
            }
          },
          { $match: { _id: ObjectId(vendorId) } }
        ])
        .toArray()
      resolve(roomsDet)
    })
  },

  // get individual room deteails
  getRoom: (roomId) => {
    return new Promise(async (resolve, reject) => {
      const room = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: '$rooms'
          },
          { $match: { 'rooms.roomId': roomId } }
        ])
        .toArray()

      resolve(room) // individual room data
    })
  },
  editRoom: (roomId, roomDetails) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection('main')
        .updateOne(
          {
            'rooms.roomId': roomId
          },
          {
            $set: {
              'rooms.$.number': roomDetails.number,
              'rooms.$.price': roomDetails.price,
              'rooms.$.qty': roomDetails.qty,
              'rooms.$.type': roomDetails.type,
              'rooms.$.amenities.wifi': roomDetails.wifi,
              'rooms.$.amenities.service': roomDetails.service,
              'rooms.$.amenities.pool': roomDetails.pool,
              'rooms.$.amenities.ac': roomDetails.ac,
              'rooms.$.amenities.tv': roomDetails.tv,
              'rooms.$.description': roomDetails.description
            }
          }
        )
      resolve()
    })
  },
  bookingHistory: (vendorId) => {
    return new Promise(async (resolve) => {
      const bookingHistory = await db
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
              'bookingdetails.vendorId': ObjectId(vendorId),
              'bookingdetails.status': {
                $in: ['Pay at hotel', 'Cancelled', 'Paid online']
              }
            }
          }
        ])
        .toArray()

      resolve(bookingHistory)
    })
  },

  dashboardTable: (vendorId) => {
    return new Promise(async (resolve) => {
      const tableData = await db
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
              'bookingdetails.vendorId': ObjectId(vendorId),
              'bookingdetails.status': {
                $in: ['Pay at hotel', 'Cancelled', 'Paid online']
              }
            }
          },
          {
            $group: {
              _id: {
                bookingdate: '$bookingdetails.currentdate'
              },
              total: {
                $sum: '$bookingdetails.total'
              }
            }
          }
        ])
        .toArray()
      console.log(tableData)

      resolve(tableData)
    })
  },
  totalEarning: (vendorId) => {
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
                  'bookingdetails.vendorId': ObjectId(vendorId)
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
  totalBooking: (vendorId) => {
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
                  'bookingdetails.vendorId': ObjectId(vendorId)
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
  onlineBookingCount: (vendorId) => {
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
                  'bookingdetails.vendorId': ObjectId(vendorId)
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
  // offlineBookingCount: (vendorId) => {
  //   return new Promise(async (resolve) => {
  //     const offlineCount = await db.get().collection('main').aggregate(
  //       [
  //         {
  //           $unwind: {
  //             path: '$bookingdetails'
  //           }
  //         }, {
  //           $match: {
  //             $and: [{ 'bookingdetails.status': 'Pay at hotel' }, {
  //               'bookingdetails.vendorId': ObjectId(vendorId)

  //             }
  //             ]
  //           }
  //         }, {
  //           $count: 'offlinecount'
  //         }
  //       ]
  //     ).toArray()
  //     resolve(offlineCount)
  //   })
  // },
  totalOnlineEarning: (vendorId) => {
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
                  'bookingdetails.vendorId': ObjectId(vendorId)
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
  offlineBookingCount: (vendorId) => {
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
                  'bookingdetails.vendorId': ObjectId(vendorId)
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
  totalOfflineEarning: (vendorId) => {
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
                  'bookingdetails.vendorId': ObjectId(vendorId)
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

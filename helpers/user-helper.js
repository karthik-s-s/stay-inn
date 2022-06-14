/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-async-promise-executor */
const db = require('../config/connection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

const Razorpay = require('razorpay')

const instance = new Razorpay({
  key_id: 'rzp_test_Pan4uXvT7F9Zu7',
  key_secret: 'JUbcBJpHHVyVSfGSWtX80F2h'
})

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      const check = await db
        .get()
        .collection('main')
        .findOne({ email: userData.email })

      if (check) {
        reject()
      } else {
        userData.password = await bcrypt.hash(userData.password, 10)
        userData.role = 'user'
        userData.isActive = true

        db.get()
          .collection('main')
          .insertOne(userData)
          .then(() => {
            // data contain status true or false
            //  console.log(data);

            resolve(userData)
          })
      }
    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve) => {
      const response = {}
      const user = await db
        .get()
        .collection('main')
        .findOne({ user: userData.user }) // user name = dB user name

      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            console.log('success')
            response.user = user
            response.status = true
            response.id = user._id

            resolve(response) // contains user and status
          } else {
            console.log('failed') // password didnt match.
            resolve({ status: false })
          }
        })
      } else {
        console.log('failed') // user didnt match
        resolve({ status: false })
      }
    })
  },

  // getAllRooms: () => {
  //     return new Promise(async (resolve, reject) => {
  //         let viewrooms = await db.get().collection('main').find({ role: "vendor" }).toArray()
  //         //console.log(viewrooms,"viewrooms")
  //         resolve(viewrooms)
  //     })
  // },

  // get all room details without searching ^^

  getRoom: (roomId) => {
    // console.log(hotelId+"dddddddddd");
    return new Promise(async (resolve) => {
      const room = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$rooms'
            }
          },
          { $match: { 'rooms.roomId': roomId } }
        ])
        .toArray()

      resolve(room)
    })
  },
  search: (booking) => {
    return new Promise(async (resolve) => {
      const sortedRoom = await db
        .get()
        .collection('main')
        .aggregate([
          {
            $unwind: {
              path: '$rooms'
            }
          },
          {
            $match: {
              'rooms.address.district': booking.place

            }
          }
        ])
        .toArray()

      // console.log(sortedRoom);
      resolve(sortedRoom)
    })
  },

  book: (booking, userid) => {
    return new Promise(async (resolve) => {
      booking.bookingId = new ObjectId()
      await db
        .get()
        .collection('main')
        .updateOne(
          { _id: ObjectId(userid) },
          {
            $push: {
              bookingdetails: booking
            }
          },
          { upsert: true }
        )
        .then((status) => {
          status.bookingId = booking.bookingId
          resolve(status)
        })
    })
  },
  getDetails: (userid, booking) => {
    return new Promise(async (resolve) => {
      const userBooking = await db
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
                  _id: ObjectId(userid),
                  'bookingdetails.roomId': booking.roomId
                }
              ]
            }
          }
        ])
        .toArray()

      resolve(userBooking)
    })
  },

  roomInc: (roomId) => {
    return new Promise(async (resolve) => {
      await db
        .get()
        .collection('main')
        .updateOne(
          { 'rooms.roomId': roomId },
          {
            $inc: {
              'rooms.$.quantity': -1,
              'rooms.$.booked': 1
            }
          }
        )
        .then((status) => {
          resolve(status)
        })
    })
  },

  storeTotalAmount: (userId, total, bookingId) => {
    return new Promise(async (resolve) => {
      await db
        .get()
        .collection('main')
        .updateOne(
          {
            _id: ObjectId(userId),
            'bookingdetails.bookingId': ObjectId(bookingId)
          },
          {
            $set: {
              'bookingdetails.$.total': total
            }
          },
          { upsert: true }
        )
        .then((status) => {
          status.bookingId = bookingId
          resolve(status)
        })
    })
  },
  generateRazorpay: (bookingId, total) => {
    return new Promise((resolve) => {
      const options = {
        amount: total * 100, // amount in the smallest currency unit
        currency: 'INR',
        receipt: '' + bookingId
      }
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err)
        } else {
          console.log(true)
          // console.log(order);
          resolve(order)
        }
      })
    })
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require('crypto')
      let hmac = crypto.createHmac('sha256', 'JUbcBJpHHVyVSfGSWtX80F2h')
      hmac.update(
        details['payment[razorpay_order_id]'] +
          '|' +
          details['payment[razorpay_payment_id]']
      )
      hmac = hmac.digest('hex')

      if (hmac === details['payment[razorpay_signature]']) {
        resolve()
      } else {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject()
        //  console.log(6565236563565);
      }
    })
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve) => {
      db.get()
        .collection('main')
        .updateOne(
          {
            'bookingdetails.bookingId': ObjectId(orderId)
          },
          {
            $set: {
              'bookingdetails.$.status': 'Paid online',
              'bookingdetails.$.bookstatus': true
            }
          },
          { upsert: true }
        )
        .then((response) => {
          resolve(response)
          console.log(response)
        })
    })
  },

  fullbookingDetails: (userid, booking) => {
    return new Promise(async (resolve) => {
      const fullDetails = await db
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
                  _id: ObjectId(userid),
                  'bookingdetails.roomId': booking.roomId
                }
              ]
            }
          }
        ])
        .toArray()

      resolve(fullDetails)
    })
  },
  changePaymentStatusOffline: (bookingId) => {
    return new Promise(async (resolve) => {
      await db.get()
        .collection('main')
        .updateOne(
          {
            'bookingdetails.bookingId': ObjectId(bookingId)
          },
          {
            $set: {
              'bookingdetails.$.status': 'Pay at hotel',
              'bookingdetails.$.bookstatus': true

            }
          },
          { upsert: true }
        )
        .then((response) => {
          resolve(response)
        })
    })
  },

  profileBooked: (userid) => {
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
                  _id: ObjectId(userid),

                  'bookingdetails.status': { $in: ['Pay at hotel', 'Cancelled', 'Paid online'] }
                }

          }
        ])
        .toArray()
      resolve(fullBooking)
    })
  },
  cancelBooking: (bookingId) => {
    return new Promise(async (resolve) => {
      await db.get()
        .collection('main').updateOne(

          {
            'bookingdetails.bookingId': ObjectId(bookingId)

          }, {
            $set: {
              'bookingdetails.$.status': 'Cancelled',
              'bookingdetails.$.bookstatus': false

            }
          },
          { upsert: true }

        ).then((status) => {
          resolve(status)
        })
    })
  },
  getLocation: () => {
    return new Promise(async (resolve) => {
      const vendors = await db.get()
        .collection('main').aggregate([
          {
            $unwind: {
              path: '$rooms'
            }

          },

          {
            $match: {
              role: 'vendor'
            }
          },
          {
            $group: { _id: '$rooms.address.district' }
          }
        ]).toArray()
      console.log(vendors)

      resolve(vendors)
    })
  },
  getUser: (userId) => {
    return new Promise(async (resolve) => {
      const user = await db
        .get()
        .collection('main')
        .aggregate([

          {
            $match:
                {
                  _id: ObjectId(userId)
                }
          }

        ])
        .toArray()
      console.log(user)
      resolve(user)
    })
  },
  updateProfile: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      db.get().collection('main').updateOne({ _id: ObjectId(userId) },
        {
          $set: {
            user: data.name,
            email: data.email,
            mobile: data.mobile
          }
        }).then((status) => {
        resolve(status)
      })
    })
  },
  roomDec: (roomId) => {
    return new Promise(async (resolve) => {
      await db.get().collection('main').updateOne(
        { 'rooms.roomId': roomId },
        {
          $inc: {

            'rooms.$.booked': -1
          }
        }
      ).then((status) => {
        resolve(status)
      })
    })
  },

  getRoomId: (bookingId) => {
    return new Promise(async (resolve) => {
      const vendor = await db.get().collection('main').aggregate([
        { $unwind: '$bookingdetails' },
        {
          $match: { 'bookingdetails.bookingId': ObjectId(bookingId) }
        }
      ]).toArray()
      console.log(vendor)

      resolve(vendor)
    })
  }
}

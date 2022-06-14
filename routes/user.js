const express = require('express')
const router = express.Router()
const userHelpers = require('../helpers/user-helper')
const moment = require('moment')// date format etc..
/* GET home page. */

const verifyUser = (req, res, next) => {
  if (req.session.uloggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

let booking = {}
router.get('/', function (req, res, next) {
  userHelpers.getLocation().then((vendordistrict) => {
    res.render('user/index', {
      user: req.session.user,
      uloggedIn: req.session.uloggedIn,
      vendordistrict
    }) // user  session passing
  })
})

router.get('/login', function (req, res, next) {
  if (req.session.uloggedIn) {
    res.redirect('/')
  } else {
    res.render('user/user-login', { logErr: req.session.logErr })
    req.session.logErr = false
    req.session.uloggedIn = false
  }
})

router.get('/signup', function (req, res, next) {
  res.render('user/user-signup', { logErr: req.session.logErr })
  req.session.logErr = false
})

router.post('/signup', function (req, res) {
  userHelpers
    .doSignup(req.body)
    .then((response) => {
      req.session.user = response.user
      req.session.userid = response._id

      req.session.uloggedIn = true
      res.redirect('/')
    })
    .catch(() => {
      req.session.logErr = true
      res.redirect('/signup')
    })
})

router.post('/login', function (req, res) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      if (response.user.role === 'user') {
        if (response.user.isActive) {
          req.session.uloggedIn = true // if login set session true
          req.session.user = response.user.user
          req.session.userid = response.user._id
          // store user data from responce to session.user
          if (req.session.notLogin) {
            res.redirect('/viewroom')
          } else {
            res.redirect('/')
          }
        } else {
          req.session.logErr = true
          res.redirect('/login')
        }
      } else {
        req.session.logErr = true
        res.redirect('/login')
      }
    } else {
      req.session.logErr = true
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.uloggedIn = false
  req.session.user = false
  res.redirect('/')
})

// router.get("/rooms", (req, res) => {
//   userHelpers.getAllRooms().then((rooms) => {
//     //console.log(rooms._id+"roooooooms");
//     res.render("user/rooms", { rooms });
//   });
// });

// get all room details without searching ^^

router.post('/rooms', (req, res) => {
  booking = req.body
  booking.roomnocount = parseInt(req.body.roomnocount)
  const checkOutdt = new Date(booking.checkOut)
  const checkIndt = new Date(booking.checkIn)
  const count = parseInt((checkOutdt - checkIndt) / (24 * 3600 * 1000))

  booking.daysCount = count
  userHelpers.search(booking).then((sortedRoom) => {
    res.render('user/rooms', {
      sortedRoom,
      user: req.session.user,
      uloggedIn: req.session.uloggedIn
    })
  })
})

let roomId
const roomDetails = {} // contains type and name
router.get('/viewroom', (req, res) => {
  if (req.session.notLogin) {
    userHelpers.getRoom(req.session.roomId).then((room) => {
      roomDetails.user = room[0].user
      roomDetails.type = room[0].rooms.type
      roomDetails.price = parseInt(room[0].rooms.price)
      roomDetails.vendorId = room[0]._id

      res.render('user/view-room', {
        room: room[0],
        user: req.session.user,
        uloggedIn: req.session.uloggedIn
      })
    })
  } else {
    roomId = req.query.id

    userHelpers.getRoom(roomId).then((room) => {
      roomDetails.user = room[0].user
      roomDetails.type = room[0].rooms.type
      roomDetails.price = parseInt(room[0].rooms.price)
      roomDetails.vendorId = room[0]._id

      res.render('user/view-room', {
        room: room[0],
        user: req.session.user,
        uloggedIn: req.session.uloggedIn
      })
    })
  }
})
let totalPrice
router.get('/book', (req, res) => {
  req.session.notLogin = false
  req.session.roomId = req.query.id
  if (req.session.uloggedIn) {
    booking.roomId = req.query.id
    booking.user = roomDetails.user
    booking.type = roomDetails.type
    booking.price = parseInt(roomDetails.price)
    booking.currentdate = moment().format('ll')
    booking.bookstatus = false
    booking.vendorId = roomDetails.vendorId
    userHelpers.book(booking, req.session.userid).then((status) => {
      const bookingId = status.bookingId
      userHelpers.roomInc(roomId).then((status) => {
        userHelpers.getDetails(req.session.userid, booking).then((userBooking) => {
          userBooking = userBooking[0]

          totalPrice =
            userBooking.bookingdetails.roomnocount *
            userBooking.bookingdetails.daysCount *
            userBooking.bookingdetails.price

          userHelpers.storeTotalAmount(req.session.userid, totalPrice, bookingId).then((status) => {
            req.session.bookingId = status.bookingId

            userHelpers.fullbookingDetails(req.session.userid, booking).then((userBooking) => {
              userBooking = userBooking[0]

              res.render('user/user-booking', {
                user: req.session.user,
                uloggedIn: req.session.uloggedIn,
                userBooking
              })
            })
          })
        })
      })
    })
  } else {
    req.session.notLogin = true

    res.redirect('/login')
  }
})

router.post('/place-order', verifyUser, (req, res) => {
  const payment = req.body
  console.log(req.body)
  if (payment.paymentmethod === 'payhotel') {
    userHelpers.changePaymentStatusOffline(req.session.bookingId)
    res.json({ payhotel: true })
  } else {
    userHelpers.generateRazorpay(req.session.bookingId, totalPrice).then((order) => {
      res.json(order)
    })
  }
})
router.get('/order-success', verifyUser, (req, res) => { // cod
  res.redirect('/login')
})

router.get('/about', function (req, res) {
  res.render('user/about', {
    user: req.session.user,
    uloggedIn: req.session.uloggedIn
  })
})
router.post('/verify-payment', verifyUser, function (req, res) {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('PAYMENT SUCCESSFULL')
      res.json({ status: true })
    })
  }).catch(() => {
    res.json({ status: false })
  })
})

router.get('/profile', verifyUser, (req, res) => {
  userHelpers.getUser(req.session.userid).then((userData) => {
    res.render('user/profile', {
      userData,
      user: req.session.user,
      uloggedIn: req.session.uloggedIn
    })
  })
})
router.get('/cancelbooking/:id', verifyUser, (req, res) => {
  userHelpers.cancelBooking(req.params.id).then((status) => {
    userHelpers.getRoomId(req.params.id).then((vendor) => {
      let roomId = {}
      roomId = vendor[0].bookingdetails.roomId
      console.log(roomId)
      userHelpers.roomDec(roomId).then((status) => {
        res.redirect('/viewbooking')
      })
    })
    // userHelpers.roomDec(req.params.id).then((status)=>{

    // })
  })
})
router.get('/viewbooking', verifyUser, (req, res) => {
  userHelpers.profileBooked(req.session.userid).then((fullBooking) => {
    for (const x in fullBooking) {
      const inn = new Date(fullBooking[x].bookingdetails.checkIn).setHours(0, 0, 0, 0)
      const out = new Date(fullBooking[x].bookingdetails.checkOut).setHours(0, 0, 0, 0)
      const now = new Date().setHours(0, 0, 0, 0)

      if (inn > now) {
        fullBooking[x].bookingdetails.cancel = true
      } else if (now >= inn && now <= out) {
        fullBooking[x].bookingdetails.active = true
      } else if (out <= now) {
        fullBooking[x].bookingdetails.active = false
      }
    }

    res.render('user/bookinghistory', {
      fullBooking,
      user: req.session.user,
      uloggedIn: req.session.uloggedIn
    })
  })
})
router.post('/updateprofile', (req, res) => {
  const data = {

    name: req.body.names,
    email: req.body.email,
    mobile: req.body.mobile
  }

  userHelpers.updateProfile(data, req.session.userid).then((status) => {
    res.json({ data: true })
  })
})
// router(/crt,verify,(req,res)=>{
//  res/rneder
// })
module.exports = router

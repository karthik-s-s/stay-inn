const express = require('express')
const router = express.Router()
const vendorHelpers = require('../helpers/vendor-helpers')
const userHelpers = require('../helpers/user-helper')
const verifyvendor = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/vendor/login')
  }
}

router.get('/login', function (req, res) {
  if (req.session.loggedIn) {
    res.redirect('/vendor/home')
  } else {
    res.render('vendor/vendor-login', {
      logErr: req.session.logErr,
      nohome: true
    })
    req.session.logErr = false
    req.session.loggedIn = false
  }
})

router.post('/login', function (req, res) {
  vendorHelpers.doLogin(req.body).then((response) => {
    // console.log(response);
    if (response.status) {
      if (response.vendor.role === 'vendor') {
        if (response.vendor.isActive) {
          req.session.loggedIn = true
          req.session.vendor = response.vendor.user
          req.session.vendorid = response.vendor._id
          req.session.isAccept = response.vendor.isAccept

          res.redirect('/vendor/home')
        } else {
          req.session.logErr = true
          res.redirect('/vendor/login')
        }
      } else {
        req.session.logErr = true
        res.redirect('/vendor/login')
      }
    } else {
      req.session.logErr = true
      res.redirect('/vendor/login')
    }
  })
})

router.get('/signup', function (req, res) {
  res.render('vendor/vendor-signup', {
    nohome: true,
    logErr: req.session.logErr
  })
  req.session.logErr = false
})

router.post('/signup', function (req, res) {
  vendorHelpers
    .doSignup(req.body)
    .then((response) => {
      req.session.vendor = response
      res.redirect('/vendor/login')
    })
    .catch(() => {
      req.session.logErr = true
      res.redirect('/vendor/signup')
    })
})

router.get('/home', verifyvendor, function (req, res) {
  if (req.session.loggedIn) {
    console.log(req.session.isAccept)

    if (req.session.isAccept === 'Pending') {
      res.render('vendor/vendor-pending', { nohome: true })
    } else if (req.session.isAccept === 'Accepted') {
      vendorHelpers.dashboardTable(req.session.vendorid).then((tableData) => {
        //   vendorHelpers.getRoomDet(req.session.vendorid).then((room)=>{
        //  room = room[0]
        //  console.log(room); }) room details
        vendorHelpers.totalEarning(req.session.vendorid).then((earning) => {
          earning = earning[0]
          vendorHelpers
            .totalBooking(req.session.vendorid)
            .then((bookingCount) => {
              vendorHelpers
                .onlineBookingCount(req.session.vendorid)
                .then((onlineCount) => {
                  onlineCount = onlineCount[0]
                  vendorHelpers
                    .offlineBookingCount(req.session.vendorid)
                    .then((offlineCount) => {
                      offlineCount = offlineCount[0]
                      vendorHelpers
                        .totalOnlineEarning(req.session.vendorid)
                        .then((onlineEarning) => {
                          onlineEarning = onlineEarning[0]

                          vendorHelpers
                            .totalOfflineEarning(req.session.vendorid)
                            .then((offlineEarning) => {
                              offlineEarning = offlineEarning[0]

                              res.render('vendor/vendor-home', {
                                name: req.session.vendor,
                                vloggedIn: req.session.loggedIn,
                                nohome: true,
                                tableData,
                                earning,
                                bookingCount,
                                onlineCount,
                                offlineCount,
                                onlineEarning,
                                offlineEarning
                              })
                            })
                        })
                    })
                })
            })
        })
      })
    } else {
      req.session.loggedIn = false
      res.redirect('/vendor/login')
    }
  } else {
    res.redirect('/vendor/login')
  }
})

router.get('/logout', function (req, res) {
  req.session.loggedIn = false
  res.redirect('/vendor/login')
})

router.get('/addroom', verifyvendor, function (req, res) {
  // console.log(req.session.vendor);
  if (req.session.loggedIn) {
    res.render('vendor/add-room', {
      name: req.session.vendor,
      vloggedIn: req.session.loggedIn,
      nohome: true
    })
  } else {
    res.redirect('/vendor/login')
  }
})
router.post('/addroom', verifyvendor, function (req, res) {
  const roomData = {
    price: req.body.price,
    originalprice: req.body.originalprice,
    quantity: parseInt(req.body.qty),
    type: req.body.type,
    number: req.body.number,
    description: req.body.description,
    amenities: {},
    address: {}
  }
  roomData.address.state = req.body.state
  roomData.address.district = req.body.district
  roomData.address.location = req.body.location
  roomData.address.pin = req.body.pin

  if (req.body.wifi === 'on') {
    roomData.amenities.wifi = true
  }
  if (req.body.service === 'on') {
    roomData.amenities.service = true
  }
  if (req.body.food === 'on') {
    roomData.amenities.food = true
  }
  if (req.body.pool === 'on') {
    roomData.amenities.pool = true
  }
  if (req.body.ac === 'on') {
    roomData.amenities.ac = true
  }
  if (req.body.tv === 'on') {
    roomData.amenities.tv = true
  }
  vendorHelpers.addroom(roomData, req.session.vendorid).then((data) => {
    const image = req.files.image
    image.mv('./public/room-image/' + data.roomId + '(1).jpg')

    const imageone = req.files.imageone
    imageone.mv('./public/room-image/' + data.roomId + '(2).jpg')
    const imagetwo = req.files.imagetwo
    imagetwo.mv('./public/room-image/' + data.roomId + '(3).jpg')

    req.session.added = true
    res.redirect('/vendor/addroom')
  })
})

router.get('/viewrooms', verifyvendor, function (req, res) {
  vendorHelpers.getRoomDet(req.session.vendorid).then((roomsDet) => {
    res.render('vendor/vendor-rooms', {
      name: req.session.vendor,
      vloggedIn: req.session.loggedIn,
      roomsDet,
      nohome: true
    })
  })
})
router.get('/editroom/:id', verifyvendor, function (req, res) {
  vendorHelpers.getRoom(req.params.id).then((room) => {
    room = room[0]
    res.render('vendor/vendor-editroom', {
      name: req.session.vendor,
      vloggedIn: req.session.loggedIn,
      room,
      nohome: true
    })
  })
})

router.post('/editroom/:id', function (req, res) {
  const image = req.files.image
  image.mv('./public/room-image/' + req.params.id + '(1).jpg')

  const imageone = req.files.imageone
  imageone.mv('./public/room-image/' + req.params.id + '(2).jpg')
  const imagetwo = req.files.imagetwo
  imagetwo.mv('./public/room-image/' + req.params.id + '(3).jpg')

  vendorHelpers.editRoom(req.params.id, req.body).then((ststus) => {
    res.redirect('/vendor/home')
  })
})
router.get('/view-booking', verifyvendor, function (req, res) {
  vendorHelpers.bookingHistory(req.session.vendorid).then((bookingHistory) => {
    for (const x in bookingHistory) {
      const inn = new Date(bookingHistory[x].bookingdetails.checkIn).setHours(
        0,
        0,
        0,
        0
      )
      const out = new Date(bookingHistory[x].bookingdetails.checkOut).setHours(
        0,
        0,
        0,
        0
      )
      const now = new Date().setHours(0, 0, 0, 0)

      if (inn > now) {
        bookingHistory[x].bookingdetails.cancel = true
      } else if (now >= inn && now <= out) {
        bookingHistory[x].bookingdetails.active = true
      } else if (out <= now) {
        bookingHistory[x].bookingdetails.active = false
      }
    }

    res.render('vendor/view-booking', {
      name: req.session.vendor,
      vloggedIn: req.session.loggedIn,
      bookingHistory,
      nohome: true
    })
  })
})
router.get('/cancelbooking/:id', verifyvendor, function (req, res) {
  console.log(req.params.id)
  userHelpers.cancelBooking(req.params.id).then((status) => {
    res.redirect('/vendor/view-booking')
  })
})

module.exports = router

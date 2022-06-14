const express = require('express')
const router = express.Router()
const adminHelpers = require('../helpers/admin-helpers')
const vendorHelpers = require('../helpers/vendor-helpers')
const userHelpers = require('../helpers/user-helper')

const verifyadmin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}
/* GET users listing. */
router.get('/', function (req, res) {
  if (req.session.adminLoggedIn) {
    adminHelpers.dashboardTableAdmin().then((tableData) => {
      adminHelpers.totalEarning().then((earning) => {
        adminHelpers.totalBooking().then((bookingCount) => {
          earning = earning[0]
          adminHelpers.onlineBookingCount().then((onlineCount) => {
            onlineCount = onlineCount[0]
            adminHelpers.offlineBookingCount().then((offlineCount) => {
              offlineCount = offlineCount[0]
              adminHelpers.totalOnlineEarning().then((onlineEarning) => {
                onlineEarning = onlineEarning[0]
                adminHelpers.totalOfflineEarning().then((offlineEarning) => {
                  offlineEarning = offlineEarning[0]
                  res.render('admin/admin-home', {
                    admin: req.session.adminLoggedIn,
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
    res.redirect('/admin/login')
  }
})

router.get('/login', function (req, res) {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin')
  } else {
    res.render('admin/admin-login', {
      logErr: req.session.logErr,
      admin: req.session.adminLoggedIn,
      nohome: true
    })
    req.session.adminLoggedIn = false
    req.session.logErr = false
  }
})

router.post('/login', function (req, res) {
  adminHelpers.doLogin(req.body).then((response) => {
    // console.log(response);

    if (response.status) {
      if (response.admin.role === 'admin') {
        req.session.adminLoggedIn = true
        req.session.admin = response.user
        res.redirect('/admin')
      } else {
        req.session.logErr = true
        res.redirect('/admin')
      }
    } else {
      req.session.logErr = true
      res.redirect('/admin')
    }
  })
})

router.get('/logout', function (req, res) {
  req.session.adminLoggedIn = false
  res.redirect('/admin/login')
})

router.get('/users', verifyadmin, function (req, res) {
  if (req.session.adminLoggedIn) {
    adminHelpers.getAllUser().then((viewuser) => {
      // console.log(`${viewuser}cccc`);

      res.render('admin/users', {
        viewuser,
        admin: req.session.adminLoggedIn,
        nohome: true
      })
    })
  }
})

router.get('/delete-user/:id', verifyadmin, (req, res) => {
  const userId = req.params.id
  adminHelpers.deleteUser(userId).then(() => {
    res.redirect('/admin/users')
  })
})

router.get('/block-user/:id', verifyadmin, (req, res) => {
  const userId = req.params.id

  adminHelpers.blockUsers(userId).then(() => {
    res.redirect('/admin/users')
  })
})

router.get('/unblock-user/:id', verifyadmin, (req, res) => {
  const userId = req.params.id
  adminHelpers.unblockUsers(userId).then(() => {
    res.redirect('/admin/users')
  })
})

router.get('/vendors', verifyadmin, function (req, res) {
  if (req.session.adminLoggedIn) {
    adminHelpers.getAllVendor().then((viewvendor) => {
      console.log(viewvendor[0].isAccept)
      for (const x in viewvendor) {
        if (viewvendor[x].isAccept === 'Accepted') {
          viewvendor[x].verify = true
        } else if (viewvendor[x].isAccept === 'Rejected') {
          viewvendor[x].verify = false
        } else {
          viewvendor[x].pending = true
        }
      }
      res.render('admin/vendors', {
        viewvendor,
        admin: req.session.adminLoggedIn,
        nohome: true
      })
    })
  }
})

router.get('/block-vendor/:id', verifyadmin, (req, res) => {
  const userId = req.params.id

  adminHelpers.blockVendor(userId).then(() => {
    res.redirect('/admin/vendors')
  })
})

router.get('/unblock-vendor/:id', verifyadmin, (req, res) => {
  const userId = req.params.id
  adminHelpers.unblockVendors(userId).then(() => {
    res.redirect('/admin/vendors')
  })
})

router.get('/delete-vendor/:id', verifyadmin, (req, res) => {
  const userId = req.params.id
  adminHelpers.deleteVendor(userId).then(() => {
    res.redirect('/admin/vendors')
  })
})

router.get('/accept-vendor/:id', verifyadmin, (req, res) => {
  adminHelpers.acceptVendor(req.params.id).then(() => {
    res.redirect('/admin/vendors')
  })
})
router.get('/reject-vendor/:id', verifyadmin, (req, res) => {
  adminHelpers.rejectVendor(req.params.id).then(() => {
    res.redirect('/admin/vendors')
  })
})
router.get('/rooms', verifyadmin, (req, res) => {
  adminHelpers.getAllVendor().then((viewvendor) => {
    console.log(viewvendor[0].isAccept)
    for (const x in viewvendor) {
      if (viewvendor[x].isAccept === 'Accepted') {
        viewvendor[x].verify = true
      } else if (viewvendor[x].isAccept === 'Rejected') {
        viewvendor[x].verify = false
      } else {
        viewvendor[x].pending = true
      }
    }
    res.render('admin/admin-rooms', {
      viewvendor,
      admin: req.session.adminLoggedIn,
      nohome: true
    })
  })
})

router.get('/roomslist/:id', verifyadmin, (req, res) => {
  vendorHelpers.getRoomDet(req.params.id).then((roomsDet) => {
    res.render('admin/admin-roomlist', {
      admin: req.session.adminLoggedIn,
      roomsDet,
      nohome: true
    })
  })
})

router.get('/userbooking', verifyadmin, (req, res) => {
  adminHelpers.userBooked().then((userData) => {
    res.render('admin/userbooking', {
      admin: req.session.adminLoggedIn,
      userData,
      nohome: true
    })
  })
})

router.get('/cancelbooking/:id', verifyadmin, function (req, res) {
  console.log(req.params.id)
  userHelpers.cancelBooking(req.params.id).then((status) => {
    res.redirect('/admin/userbooking')
  })
})

module.exports = router

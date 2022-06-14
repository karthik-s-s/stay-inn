/* eslint-disable n/no-path-concat */
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const hbs = require('express-handlebars')
// partials setup^^
const db = require('./config/connection')
// mongodb module import ^^
const session = require('express-session') // session and cookie import
const fileUpload = require('express-fileupload')
const Handlebars = require('handlebars')
const nocache = require('nocache') // session logout back
db.connect((err) => {
  if (err) {
    console.log('connection error')
  } else {
    console.log('Database connected')
  }
})

const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')
const vendorRouter = require('./routes/vendor')
const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')
app.engine(
  'hbs',
  hbs.engine({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layout/',
    partialsDir: __dirname + '/views/partials/'
  })
)
// partials root setup^^

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(nocache())

app.use(
  session({
    secret: 'key',
    saveUninitialized: true,
    cookie: { maxAge: 600000 },
    resave: false
  })
)
// session and cookie creating ^^
app.use(fileUpload()) // img upload
app.use('/', userRouter)
app.use('/admin', adminRouter)
app.use('/vendor', vendorRouter)

Handlebars.registerHelper('inc', function (value, options) {
  return parseInt(value) + 1
})
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app

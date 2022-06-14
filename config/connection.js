const mongoClient = require('mongodb').MongoClient
require('dotenv').config()


const state = {
  db: null
}

// create function to access this from all pages
// connection done vv

module.exports.connect = function (done) {
  const url = process.env.DATABASE
  const dbname = 'hotel'
  mongoClient.connect(url, (err, data) => {
    if (err) {
      return done(err)
    } else {
      state.db = data.db(dbname)// hotel
      done()
    }
  })
}

// for accessing vv

module.exports.get = function () {
  return state.db
}

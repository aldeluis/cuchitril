const users = require('./users')
const cosas = require('./cosas')

module.exports = function (express) {
  express.get    ( '/'                 ,(i,o)=>o.end('hola') )
  express.get    ( '/cosas'            ,cosas.get            )
  express.get    ( '/cosas/:id'        ,cosas.get_id         )
  express.post   ( '/cosas'            ,cosas.post           )
  express.patch  ( '/cosas/:id'        ,cosas.patch_id       )
  express.delete ( '/cosas/:id/:prop?' ,cosas.delete_id_prop )
  express.post   ( '/login'            ,users.logeo, users.me  )
}

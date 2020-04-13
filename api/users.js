// users.js
const bcrypt     = require('bcryptjs')
const Passport   = require('passport')
const PassLocal  = require('passport-local')

Usuarios = [
  {id:1, u:"sucri", h:"", p:"lalala",r:"admin"},
  {id:2, u:"aldeluis", h:"", p:"tururu", r:"admin"},
  {id:3, u:"anonimo", h:"", p:"jajeji",r:"user"}, 
]

exports.comparePassword = function (password, hash) {
  return bcrypt.compare(password,hash)
}

const buscaUsuario = (username, done) => {
  let usuario = Usuarios.find(i => i.u == username)
  if (usuario == undefined)     return done(null, false)
  else if (usuario)             return done(null, usuario)
                                return done("Error en buscaUsuario")
}

const passLocal = new PassLocal(
  (username, password, done) => {
    buscaUsuario (username, (err,usuario)=>{
      if (err)                      return done(err)
      else if (!usuario)            return done(null, false)
      else if (usuario.p!=password) return done(null, false)
                                    return done(null, usuario)
    })
    console.log("POST /login",username,password)
    return done (null, {username:"u",password:"p"} )
})

//exports.logeo = Passport.authenticate(passLocal,{"session":false})
exports.logeo = Passport.authenticate(passLocal)
exports.me = (req,res) => { res.json({id:req.user.id,rol:req.user.r}) }


const Express    = require('express')
const Session    = require('express-session')
const Cors       = require('cors')

const express = Express()
express.use(Cors())
express.use(Express.json())
express.set('ip','127.0.0.1')
express.set('port',1000)

//API
require('./api/routes')(express)

let formulario = "\
<html>\
  <head><style>* {background-color: #222; color: #e6e6e6; border-color: #e6e6e6;}</style></head>\
  <body>\
    <form>\
      <input name='username' type='text'/></br>\
      <input name='password' type='text'/></br>\
      <button>Enviar</button>\
    </form>\
  </body>\
</html>\
"


express.get ('/formulario',(req,res)=>{res.end(formulario)})

express.listen(express.get("port"),express.get('ip'),
  () => {
    console.log("Escuchando en "+express.get("ip")+":"+express.get("port"))
})


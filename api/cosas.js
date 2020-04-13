// cosas.js
exports.get = get_cosas
exports.get_id = get_cosas_id
exports.post = post_cosas
exports.patch_id = patch_cosas_id
exports.delete_id_prop = delete_cosas_id_prop

const Redis = require('ioredis')
let redis = new Redis()

// Cosas (inventario)
function post_cosas (req,res) {
  let cosa = req.body
  console.log("POST cosa nueva",cosa)
  if (cosa.nombre && cosa.nombre != null) {
    let id = Date.now() //identificador sencillo con milisegundos para evitar conflictos
    redis.zadd("cosas:indice:nombre",0,cosa.nombre).then((r) => {
    // zadd devuelve 1 si ha sido insertado y 0 si no pq ya existía el nombre 
      if (r==1) {
        redis.multi()
        .zadd("cosas:indice:creacion",id,"cosas:"+id)
        .hmset("cosas:"+id,cosa)
        .exec((e,r)=>{
          //console.log(r)
          //console.log(e,r)
          res.location('/cosas/'+id)
          res.sendStatus(201).end("ok")
          })
      } else {
        res.sendStatus(409).end("nombre ya existente")
        console.log("nombre ya existente")
      }
    }).catch( (e)=>{
      console.log(e)
      res.sendStatus(500)
    })
  } else {
    res.sendStatus(404)
    console.log("404")
  }
}

function get_cosas_id (req,res) {
  console.log("GET",req.url,req.params.id)
  redis.hgetall("cosas:"+req.params.id).then(r=>res.json(r))
}

function get_cosas (req,res) {
  console.log("GET",req.url,req.params.id)
  redis.zrevrange("cosas:indice:creacion",0,-1,"withscores").then( r => {
    let keys = r.filter((a,i)=>i%2===0)
    let scores = r.filter((a,i)=>i%2===1)
    Promise.all(keys.map(i=>redis.hgetall(i))).then( rp => {
      rp = rp.map((o,i)=>({id:parseInt(scores[i]),...o}))
      res.json(rp)
    }).catch((e)=>console.log(e))
  })
}

function patch_cosas_id (req,res) {
  let errores = []
  let id = req.params.id
  let nuevainfo = req.body
  if (nuevainfo.id) { delete nuevainfo.id }
  
  console.log("PATCH",id,"nueva info:",nuevainfo)

  redis.zcount("cosas:indice:creacion",id,id).then(r=>{
    if (r==1) {
      redis.hgetall("cosas:"+id).then(info => {
        console.log("PATCH",id,"vieja info",info)
        let props              = Object.keys(info)
        let props_solicitadas  = Object.keys(nuevainfo)
        let props_nuevas       = props_solicitadas.filter( x => !props.includes(x) )
        let props_actualizadas = props_solicitadas.filter( x => props.includes(x) && String(nuevainfo[x])!=String(info[x]))

        //props_solicitadas.forEach( x => { console.log(String(r[x]),String(req.body[x]),String(r[x])!=String(req.body[x])) })
        if (props_nuevas.length>0) {
          let props_nuevas_consolidadas=Object.assign(...props_nuevas.map( p => { return {[p]:nuevainfo[p]} }) )
          console.log("propiedades nuevas consolidadas",props_nuevas_consolidadas)
          redis.hmset("cosas:"+id,props_nuevas_consolidadas)
        }

        if (props_actualizadas.length>0) {
          let props_actualizadas_consolidadas=Object.assign(...props_actualizadas.map( p => { return { [p]:nuevainfo[p] } }))

	        //Si hay nombre nuevo sólo se cambia si no existe previamente.
	        if (props_actualizadas_consolidadas.nombre) {
            let nuevonombre=props_actualizadas_consolidadas.nombre
            redis.zrangebylex("cosas:indice:nombre","["+nuevonombre,"["+nuevonombre).then((r)=>{
              if (!r.length) {
                console.log("PATCH",id,"nombre propuesto no encontrado en indice")
              } else if (r.length==1) {
                console.log("PATCH",id,"nombre propuesto ENCONTRADO en indice")
                delete props_actualizadas_consolidadas.nombre
                errores.push="nombre ya utilizado"
              }
            })
          }
              
        console.log("propiedades actualizadas consolidadas",props_actualizadas_consolidadas)
        redis.hmset("cosas:"+id,props_actualizadas_consolidadas)

        // Respuesta HTTP
        if (props_actualizadas_consolidadas) {
            res.sendStatus(409).end("ya existe el nombre en indice")
            console.log("PATCH",id,"cambios no aceptados\n")
          }
          else if (cambios>0) {
            res.location('/cosas/'+id)
            res.sendStatus(200).end("ok")
            console.log("PATCH",id,"cambios aceptados\n")
          }
          else {
            res.sendStatus(204).end()
            console.log("PATCH",id,"sin cambios\n")
          }
        }
      })
    }
    else { res.sendStatus(404) }
  })
}

function delete_cosas_id_prop (req,res) {
  let id = req.params.id
  let prop = req.params.prop
  console.log("DELETE",id,prop)
  redis.zcount("cosas:indice:creacion",id,id).then(r=>{
    if (r!=1) res.sendStatus(404)
    else {
      if (prop==undefined) {
        // borrar todo el objeto y sus índices
        //console.log("borrando todo el objeto",id)
        redis.hget("cosas:"+id,"nombre").then(n=>{
          redis.multi()
          .zrem("cosas:indice:nombre",n)
          .zrem("cosas:indice:creacion","cosas:"+id)
          .del("cosas:"+id)
          .exec((e,r)=>res.end("ok"))
        })
      }
      else {
        // borrar solo la propiedad si no es "nombre"
        //console.log("borrando la propiedad",prop)
        if (!["nombre"].includes(prop)) {
          redis.hdel("cosas:"+id,prop).then(r=>{
            if (r==1) {res.end("ok")}
            // no encuentro la propiedad
            else {res.sendStatus(404)}
          })
        // prohibido borrar la propiedad nombre
        } else {res.sendStatus(403)}
      }
    }
  })
}


const https = require('https')
const crypto = require('crypto')

const doRequest = function (opts, payload) {
	return new Promise(function(resolve, reject) {
      payload = JSON.stringify(payload); 

		var options = {
			hostname: opts.hostname,
			port:     opts.port,
			path:     opts.path,
			method:   opts.method,
			headers: 	{
				'Content-Type': 	'application/json',
				'Content-Length': payload.length
			},
			rejectUnauthorized : true
		}

		var request = https.request(options, function(response) {
			var data = '';

			response.on('data', function(chunk) { data += chunk; });
			response.on('end', function() {
				try {
					data = JSON.parse(data);
					if (data.error) {
						return reject(data);
					}
				} catch(e) {
					return reject(data);
				}

				resolve(data);
			});
		});

		request.on("error", reject);

		request.write(payload);
		request.end();
	});

}

const zeroPad = (buf, blocksize) => {
  const pad = Buffer.alloc((blocksize - (buf.length % blocksize)) % blocksize, 0);
  return Buffer.concat([buf, pad]);
}

const encrypt3DES = (key, message) => {
  const keyBuf = Buffer.from(key, 'base64');
  const iv = Buffer.alloc(8, 0);

  const messageBuf = Buffer.from(message.toString(), 'utf8');
  // Align to blocksize by padding the message buffer
  const paddedMessageBuf = zeroPad(messageBuf, 8);

  const cipher = crypto.createCipheriv('des-ede3-cbc', keyBuf, iv);
  cipher.setAutoPadding(false);
  const encryptedBuf = Buffer.concat([cipher.update(paddedMessageBuf), cipher.final()]);

  // Make sure that encrypted buffer is not longer than the padded message
  const maxLength = Math.ceil(messageBuf.length / 8) * 8;
  return encryptedBuf.slice(0, maxLength);
}

let sha256Sign = (merchantKey, order, params) => {
  const orderKeyBuf = encrypt3DES(merchantKey, order);
  return crypto.createHmac('sha256', orderKeyBuf).update(params).digest('base64');
}

let orden = {
  Ds_Merchant_TransactionType:"0",             //Obligatorio
  Ds_Merchant_MerchantCode:"283031680",        //Obligatorio
//  Ds_Merchant_MerchantCode:"999008881",        //Obligatorio
  Ds_Merchant_Terminal:"001",                  //Obligatorio
  Ds_Merchant_Order:"202004111438",            //Obligatorio
  Ds_Merchant_Amount:"4345",                   //Obligatorio
  Ds_Merchant_Currency:"978",                  //Obligatorio
  Ds_Merchant_PAN:"4548812049400004",
  Ds_Merchant_ExpiryDate:"2012",
  Ds_Merchant_CVV2:"123"
}

let orden_json = JSON.stringify(orden)

console.log("orden_json:",orden_json)

let orden_base64 = Buffer.from(orden_json).toString('base64')

console.log("orden_base64:",orden_base64)

let clave = "sq7HjrUOBfKmC576ILgskD5srU870gJ7" //pruebas sq7HjrUOBfKmC576ILgskD5srU870gJ7
let signature = sha256Sign(clave,orden.Ds_Merchant_Order,orden_base64)

console.log(signature)

let post = {
  Ds_MerchantParameters:orden_base64,
  Ds_Signature:signature,
  Ds_SignatureVersion:"HMAC_SHA256_V1"
}

const qs = require('querystring')

console.log(qs.stringify(post))

doRequest({
					hostname: 		'sis-t.redsys.es',
					port:     		25443,
					path:     		'/sis/rest/trataPeticionREST',
					method:   		'POST'	
				}, post)
				.then(console.log)
				.catch(console.error);

console.log(JSON.stringify(post))

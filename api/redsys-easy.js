const {
  Redsys,
  SANDBOX_URLS,
  TRANSACTION_TYPES,
  randomTransactionId
} = require('redsys-easy')

const redsys = new Redsys({
  secretKey: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7',
  urls: SANDBOX_URLS, // Also PRODUCTION_URLS
})

let orden = {
  DS_MERCHANT_TRANSACTIONTYPE:0,
  DS_MERCHANT_CODE:283031680,
  DS_MERCHANT_TERMINAL:001,
  DS_MERCHANT_ORDER:202004102230,
  DS_MERCHANT_AMOUNT:4345,
  DS_MERCHANT_CURRENCY:000,
  DS_MERCHANT_PAN:4548812049400004,
  DS_MERCHANT_EXPIRYDATE:1220,
  DS_MERCHANT_CVV2:123
}

const params = {
  // amount in smallest currency unit(cents)
  // 33.50€
  amount: 3350,
  order: 202004111400,
  merchantCode: 283031680,
  currency: 'EUR',
  pan: 4548812049400005,
  cvv: 123,
  expiryDate: '1220', // MMYY format
  transactionType: TRANSACTION_TYPES.AUTHORIZATION,
  terminal: 1,
  // Raw parameters
  raw: {
    // merchantData
    DS_MERCHANT_MERCHANTDATA: 'foo',
  },
}

console.log(params)

redsys.wsPetition(params).then(result => {
  console.log(result);
})

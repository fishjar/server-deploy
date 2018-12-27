const Koa = require('koa');
const app = new Koa();
const os = require('os');
const hostName = os.hostname();
const request = require('request');
const {
  PROTOCOL,
  PORT,
  APP1_NAME,
  APP1_PORT,
  APP2_NAME,
  APP2_PORT,
  GW1_NAME,
  GW1_PORT,
  GW2_NAME,
  GW2_PORT,
} = process.env;

app.use(async ctx => {
  const body = await api(`${PROTOCOL}://${APP2_NAME}:${APP2_PORT}`);
  ctx.body = `Hello APP1 (${hostName}) -> ${body}`;
});

async function api(url) {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) {
        reject(error)
      }
      resolve(body)
    })
  })
}

app.listen(APP1_PORT || PORT || 3000);

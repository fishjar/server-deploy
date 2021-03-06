const Koa = require('koa');
const app = new Koa();
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
  // ctx.body = 'Hello GW1';
  const body = await api(`${PROTOCOL}://${APP1_NAME}:${APP1_PORT}`);
  ctx.body = `GW1 -> ${body}`;
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

app.listen(GW1_PORT || PORT || 3000);

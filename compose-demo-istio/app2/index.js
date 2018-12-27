const Koa = require('koa');
const app = new Koa();
const os = require('os');
const hostName = os.hostname();
// const {
//   PROTOCOL,
//   PORT,
//   APP1_NAME,
//   APP1_PORT,
//   APP2_NAME,
//   APP2_PORT,
//   GW1_NAME,
//   GW1_PORT,
//   GW2_NAME,
//   GW2_PORT,
// } = process.env;

app.use(async ctx => {
  ctx.body = `Hello APP2 (${hostName})`;
});

// app.listen(APP2_PORT || PORT || 3000);
app.listen(3000);

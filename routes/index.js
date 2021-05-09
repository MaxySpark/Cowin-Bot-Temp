var express = require('express');
var router = express.Router();
var rp = require('request-promise');
const moment = require('moment');
const _ = require('lodash');

/* GET home page. */
router.get('/', async function(req, res, next) {
  const data = await getSlot();
  if (data.length > 0) {
    await sendTelegram(data);
  }
  res.send(data);
});

async function sendTelegram(data) {
  const url = 'https://api.telegram.org/bot1895273415:AAHICYk2TW0bXw9SnrdkX9H8HTzaXCknL44/sendMessage';
  await rp.post(url, {
    json: true,
    body: {
        "chat_id":"59180442",
        "text": `<pre>${data.map(o => `|${o.name}|${o.address}|${o.sessions.date}|${o.sessions.available}\n`).join('\n')}</pre>`,
        parse_mode: 'HTML'
      }
  })
}


async function getSlot() {
  const url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=53&date=`
  const today = moment().format('DD-MM-YYYY');
  const data = await rp.get(`${url}${today}`).json();
  return formatData(data);
}

function formatData(obj) {
  const data = obj.centers.map(o => {
    return {
      name: o.name,
      address: o.address,
      // sessions: o.sessions.map(s => {
      //   return {
      //     date: s.date,
      //     available: s.available_capacity
      //   }
      // }),
      sessions: {
        date: o.sessions[0].date,
        available: o.sessions[0].available_capacity || 1
      }
    }
  });
  const filter = _.filter(data, o => o.sessions.available !== 0);
  return filter;
}

module.exports = router;

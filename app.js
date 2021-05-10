var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var rp = require('request-promise');
const moment = require('moment');
const _ = require('lodash');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

async function getData() {
    const data = await getSlot();
    if (data.length > 0) {
        await sendTelegram(data);
    }
}

setTimeout(async () => {
    await getData();
}, 0);

setInterval(async () => {
    await getData();
}, 120000)

app.get('/', async function (req, res, next) {
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
            "chat_id": "59180442",
            "text": `${data.map(o => `|${o.name}|${o.address}|<i>${o.sessions.date}</i>| <b>**${o.sessions.available}**</b> |${o.sessions.vaccine}|${o.sessions.age}\n`).join('\n')}`,
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
            sessions: o.sessions.map(s => {
              return {
                date: s.date,
                available: s.available_capacity,
                vaccine: s.vaccine,
                age: s.min_age_limit
              }
            })
        }
    });


    const fm = _.flatMap(data, o => {
        const arr = [];
        o.sessions.forEach((e, i) => {
            arr.push({
                name: o.name,
                address: o.address,
                sessions: o.sessions[i]
            })
        })
        return arr;
    })

    const filter = _.filter(fm, o => o.sessions.available !== 0);
    return filter;
}

module.exports = app;

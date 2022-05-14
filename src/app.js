const express = require('express')
const rabbitmq = require("./rabbitmq");
const wbot = require('./index')
var cors = require('cors')
var app = express()

app.use(cors());
const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get('/get-qrcode', async (req, res) => {
    const qrCode = await wbot.getQRcode();
    res.send({ qrCode });
})
app.get('/login-info', async (req,res)=>{
    const isLoggedIn = await wbot.checkLogin();
    res.send({ isLoggedIn: !!isLoggedIn });
});

wbot.initWbot();
(async () => {
    await rabbitmq.subscribeToRabbitmq();
    app.listen(port, async () => {
        console.log(`Example app listening at http://localhost:${port}`)
    })

})();


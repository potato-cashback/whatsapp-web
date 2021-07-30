const { Client } = require('whatsapp-web.js');
const client = new Client({"puppeteer":{
    headless: true,
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox'
    ]
}});


var QRFOUND = false
var QRCODE = ""

client.on('qr', (qr) => {
    QRCODE = qr
    console.log('QR generated')
});

client.on('ready', () => {
    console.log('Client is ready!');
    QRFOUND = true
    client.sendMessage('77476215825@c.us', 'кешбэк бот готов');
});

client.on('message', message => {
    console.log(message.from)
	if(message.body === 'ты крыса') {
		client.sendMessage(message.from, 'сам ты крыса');
	}else{
        client.sendMessage(message.from, `Зайдите в телеграм бота чтобы воспользоваться кешбэком https://t.me/KZcashback_bot`);
    }
});



const express = require('express')
const app = express()
const port = process.env.PORT || 3000

const cashback = (s) => {
    let coef = [0.06, 0.11]
    let res = 0
    s = s - 0
    
	if(s >= 5000)
    res = coef[1]
    else if(s >= 3000)
    res = coef[0]
    return res * s
}

app.get('/', (req, res) => {
    res.send(`
    <img></img>
    <br>
    <style>
        img{
            width:80vw;
            max-width:400px;
            image-rendering: pixelated;
        }
    </style>
    <script>
        QRCODE = ""

        fetch("/initialize")
        .then(() => {
            console.log("initialized")
        })
        .then(()=>{
            var interval = setInterval(() => {
                fetch("/qr")
                .then(r => r.json())
                .then(r => {
                    console.log(r)
                    if(r.qrfound){
                        clearInterval(interval)
                        document.body.innerHTML = "Client Ready"
                    }else if(r.qr != QRCODE){
                        QRCODE = r.qr;
                        url = "https://chart.googleapis.com/chart?cht=qr&chl=" + encodeURIComponent(QRCODE) + "&chs=70x70&choe=UTF-8&chld=L|2"
                        document.body.querySelector("img").src = url;
                    }
                })
            }, 3000)
        })
    </script>
    `)
})
app.get('/initialize', (req, res) => {
    client.initialize();
    console.log('Client initialized!')
    res.send("good")
})

app.get('/qr', (req, res) => {
    res.send(`{"qr": "${QRCODE}", "qrfound": ${QRFOUND}}`)
})

app.get('/qrfound', (req, res) => {
    res.send(QRFOUND)
})

app.get('/:phone/:sum', (req, res) => {
    if(QRFOUND){
        reciever = req.params.phone.split("+").join("") + "@c.us"
        sum = cashback(req.params.sum)

        client.sendMessage(reciever, `Ура! 🎉🥳! На ваш счет добавилось ${sum}₸! 💰
Зайдите в телеграм бота чтобы воспользоваться кешбэком
https://t.me/KZcashback_bot`);
        
        res.send("good")
    }else{
        res.send(`
            <script>
                alert("Ввойдите в WhatsApp")
                window.location.href = "/"
            </script>
        `)
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
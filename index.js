const fs = require('fs');
const { Client, MessageMedia } = require('whatsapp-web.js');
const SESSION_FILE_PATH = './session.json';

const options = {
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox'
        ]
    }
}

let sessionData;
if(fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);

    if(sessionData)
        options.session = sessionData
}

const client = new Client(options);

/* -------------------------------------------------------------*/ 

client.on('authenticated', (session) => {
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
        if (err) {
            console.error(err);
        }
    });
});

/* -------------------------------------------------------------*/ 

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

/* -------------------------------------------------------------*/ 

const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

const fetch = require('node-fetch');
const cashback = async (s) => {
	url = `https://potato-cashback.herokuapp.com/getCashbackLogic/${s}`
	return await fetch(url)
	.then(r => r.text())
	.then(r => {
		res = parseFloat(r) * s
		return res
	})
}

app.get('/', (req, res) => {
    if(!QRFOUND)
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
    else
    res.send("Client Ready")
})
app.get('/initialize', (req, res) => {
    if(!QRFOUND)
    client.initialize();
    console.log('Client initialized!')
    res.send("good")
})

app.get('/qr', (req, res) => {
    res.send(`{"qr": "${QRCODE}", "qrfound": ${QRFOUND}}`)
})

app.get('/qrfound', (req, res) => {
    if(!QRFOUND){
        client.initialize();
        console.log('Client initialized!')
    }
    res.send(QRFOUND)
})

app.get('/:phone/:sum', async (req, res) => {
    if(QRFOUND){
        reciever = req.params.phone.split("+").join("") + "@c.us"
        sum = await cashback(req.params.sum)

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

/* -------------------------------------------------------------*/ 

app.post("/mail/", (req, res) => {
    // if(!QRFOUND) res.status(400).send("whatsapp client not activated");

    numbers = req.body.numbers || []
    message = req.body.message || ""
    base64Image = req.body.base64Image || ""

    
    if(typeof numbers == "string") numbers = JSON.parse(numbers) // this thing makes into int which is bad, that's why there is shit code down here
    try{
        numbers[0][0]
    }
    catch(err){
        numbers = [`${numbers}`]
    }

    // console.log(numbers, message, base64Image)

    if (numbers && message){
        for(let i=0; i < numbers.length; i++){
            reciever = numbers[i].split("+").join("") + "@c.us"
            console.log(reciever)

            if(base64Image && base64Image != "#"){
                media = new MessageMedia('image/png', base64Image);
                client.sendMessage(reciever, media, {caption: message})
            }else{
                client.sendMessage(reciever, message);
            }
        }
        res.send("ok");
    } else {
        res.status(400).send("request params not mentioned");
    }
})

/*

USAGE OF MAILING SYSTEM

const url = '/mail/';

try {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({
            numbers:["77476215825","77478711986","77478303734"],
            message:"ты крыса, а я рассылка",
            base64Image:""
        })
    });
    const responce = await response.text();
    console.log('Успех:', responce);
} catch (error) {
    console.error('Ошибка:', error);
}

*/

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
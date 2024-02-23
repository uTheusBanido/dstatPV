const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");
const cluster = require("cluster");
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/1204482334028734484/lYjGM0eLo1hUaMJK6-gIUKq2-1TeRP6Caa1loyuD9fpJglo74bMPZuPh7G9UeVvfgT5Q")
const os = require("os");
const { set } = require("date-fns");

const cpus = os.cpus().length;
const port = 80;
const index = fs.readFileSync("./index.html");

if (cluster.isMaster) {
  console.log(`Number of CPUs is ${cpus}`);
  console.log(`Master ${process.pid} is running`);

  let requests = 0;
  let childs = [];
  for (let i = 0; i < cpus; i++) {
    let child = cluster.fork();
    child.on("message", (msg) => {
      requests++;
    });
    childs.push(child);
  }
  
  setInterval(() => {
    for (let child of childs) {
      if(requests > 20) {
        let time = new Date().toLocaleTimeString();
        const embed = new MessageBuilder()
          .setColor("#2F3136")
          .setDescription(`
          ⚠ **NOVO ATAQUE DETECTADO** ⚠
 
           📶 **REQUEST POR SEGUNDOS**: ${requests}
           🕘 **HORARIO**: ${time}

            📊 **INFORMAÇÕES**
            > **CPU**: ${os.cpus().length}
            > **MEMORIA USADA EM %**: ${((os.totalmem() - os.freemem()) / os.totalmem()) * 100}%
            > **PLATAFORMA**: ${os.platform()}
            > **UPTIME**: ${os.uptime()}
            > **TIPO DE CPU**: ${os.type()}

          `)
 
      return hook.send(embed);
        }
    }
  }, 10000);

  setInterval(() => {
    for (let child of childs) {
      child.send(requests);
    }
    requests = 0;
  }, 1000);
} else {
  console.log(`Worker ${process.pid} started`);

  const handler = function (req, res) {
    if (req.url == "/dstat") {
      process.send(0);
      res.end();
    } else {
      res.end(index);
    }
  };

  const server = http.createServer(handler);
  const wss = new WebSocket.Server({ server });

  process.on("message", (requests) => {
    wss.clients.forEach((client) => client.send(requests));
  });

  server.listen(port);
}

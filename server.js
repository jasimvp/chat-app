import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const PORT = 3001;

const server = http.createServer((req,res) => {
    const filePath = path.join(import.meta.dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, content) => {
        if(err) {
            res.writeHead(500, {'Content-Type':'text/plain'});
            res.end("Server error");
            return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(content);
    });
});

const wss = new WebSocketServer({server});

const broadcast = (data) => {
    const messageString = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(messageString);
        }
    })
}

wss.on("connection", (socket,req) => {
    const username = new URL(req.url, 'http://localhost').searchParams.get('username');

    broadcast({type: "system", "text": `${username} joined`});

    socket.on('message', (data) => {
        try{
            const parsedData = JSON.parse(data);
            const {text} = parsedData;

            broadcast({
                type: 'chat',
                username: username,
                text: text
            });
        } catch (err) {
            console.log("Invalid JSON message recieved", err);
        }
    });

    socket.on("close", () => {
        broadcast({
            type: 'system',
            text: `${username} left`,
        });
    });
});

server.listen(PORT, () => {
    console.log(`Chat server running at http://localhost:${PORT}`);
})
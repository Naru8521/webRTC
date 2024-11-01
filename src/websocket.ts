import * as fs from "fs";
import * as https from "https";
import WebSocket, { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const PORT = 8000;

// HTTPSサーバー設定
const server = https.createServer({
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert")
});

// WebSocketサーバーの設定
const wss = new WebSocketServer({ server });
const clients = new Map(); // クライアントIDとソケットのペアを保持

// クライアント接続時の処理
wss.on("connection", (socket) => {
    const clientId = uuidv4(); // 一意のIDを生成
    clients.set(clientId, socket);
    console.log(`クライアント接続: ${clientId}`);

    // クライアントに自身のIDを送信
    socket.send(JSON.stringify({ type: "id", id: clientId }));

    // 新しいクライアントの接続を他のクライアントに通知
    for (const [otherClientId, otherSocket] of clients) {
        if (otherClientId !== clientId) {
            otherSocket.send(JSON.stringify({ type: "join", id: clientId }));
        }
    }

    // メッセージ受信処理
    socket.on("message", (message: string) => {
        const data = JSON.parse(message);
        const { type, targetId, sdp, candidate } = data;

        if (type === "offer" || type === "answer" || type === "candidate") {
            // メッセージを対象のクライアントに送信
            const targetSocket = clients.get(targetId);
            if (targetSocket) {
                targetSocket.send(JSON.stringify({ type, id: clientId, sdp, candidate }));
            }
        }
    });

    // クライアント切断時の処理
    socket.on("close", () => {
        clients.delete(clientId);
        console.log(`クライアント切断: ${clientId}`);
        
        // 他のクライアントに切断を通知
        for (const [otherClientId, otherSocket] of clients) {
            otherSocket.send(JSON.stringify({ type: "leave", id: clientId }));
        }
    });
});

// サーバーの起動
server.listen(PORT, () => {
    console.log(`WebSocketサーバーがポート${PORT}で起動しました`);
});

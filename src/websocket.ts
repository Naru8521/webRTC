import * as fs from "fs";
import * as https from "https";
import WebSocket from "ws";

const PORT = 8000;

// SSL証明書の読み込み
const server = https.createServer({
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert")
});

const wss = new WebSocket.Server({
    server
});

wss.on("error", (err) => {
    console.error("サーバーエラー:", err);
});

// サーバー接続
wss.on("connection", (socket: WebSocket) => {
    console.log("新しいクライアントが接続されました");

    // 接続終了
    socket.on("close", () => {
        console.log("クライアントが切断されました");
    });

    // メッセージ受信処理
    socket.on("message", (message: WebSocket.RawData) => {
        const output = message.toString();
        const data = JSON.parse(output);
        const type: string = data.type;

        switch (type) {
            case "offer":
            case "answer":
            case "candidate":
                // シグナリングデータを他のクライアントに中継
                broadcast(socket, data);
                break;

            default:
                break;
        }
    });
});

// 他のクライアントにメッセージを中継する関数
function broadcast(sender: WebSocket, data: any) {
    const clients = wss.clients;

    for (const client of clients) {
        // 自分自身に送信しない & 接続がオープンしているクライアントのみ
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }
}

wss.on("listening", () => {
    console.log(`WebSocketサーバーをポート${PORT}番で起動しました`);
});

server.listen(PORT, () => {
    console.log(`HTTPSサーバーをポート${PORT}で起動しました`);
});

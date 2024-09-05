import * as fs from "fs";
import * as https from "https";
import express from "express";

const PORT = 5000;
const app = express();

// 証明書とキーを読み込む
const options = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert")
};

// 静的ファイルを提供
app.use(express.static("public"));

// HTTPSサーバーを起動
https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPSサーバーがポート${PORT}で起動しました`);
});

const express = require("express");
const downloader = require("./routes/downloader");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/api", downloader);

let port = 2020;

console.log(`Listen Port: ${port}`);
app.listen(port);

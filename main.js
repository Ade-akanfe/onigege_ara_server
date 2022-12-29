//packages to be used
const express = require("express")
const path = require("path")
require("dotenv").config()
const bodyParser = require("body-parser")
const user_route = require("./routes/user-route")
const exam_route = require("./routes/exam-route")
const http = require("http")
//creating an instance of http
const app = express()
const cors = require("cors")
const { post_route } = require("./routes/post-route")
const { port, allowed_domains } = require("./config/index")
//registering middleware

app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ origin: allowed_domains }));



app.use("/public", express.static(path.join(__dirname, "/public")))
app.use("/api/user", user_route)
app.use("/api/exam", exam_route)
app.use("/api/post", post_route)
//handles error
app.use((error, req, res, next) => {
    const status = error.status || 500;
    const message = error.message;
    res.status(status).json({ message: message });
});


const server = http.createServer(app)


server.listen(port, () => {
    const io = require('./socket').init(server);
    io.on('connection', socket => {
        console.log('Client connected');
    });
    require("./utils/db")
    console.log("App Started")
})
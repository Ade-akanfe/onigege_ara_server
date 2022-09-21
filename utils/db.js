const mongoose = require("mongoose")
require("dotenv").config()




mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log("Connection Successful")
    })
    .catch((error) => {
        console.log("An error has occured")
        console.log(error.message)
    })

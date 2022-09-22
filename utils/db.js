const mongoose = require("mongoose")


mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => {
        console.log("Connection Successful")
    })
    .catch((error) => {
        console.log("An error has occured")
        console.log(error.message)
    })

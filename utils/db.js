const mongoose = require("mongoose")
const { mongodb_connection } = require("../config")


mongoose.set('strictQuery', false);

mongoose.connect(mongodb_connection)
    .then(() => {
        console.log("Connection Successful")
    })
    .catch((error) => {
        console.log("An error has occured")
        console.log(error.message)
    })

// mongoose.set("autoIndex", "true")
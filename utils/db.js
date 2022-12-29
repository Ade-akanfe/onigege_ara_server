const mongoose = require("mongoose")
const { mongodb_connection } = require("../config")


mongoose.connect(mongodb_connection)
    .then(() => {
        console.log("Connection Successful")
    })
    .catch((error) => {
        console.log("An error has occured")
        console.log(error.message)
    })

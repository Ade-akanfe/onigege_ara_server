
const fs = require("fs")
const deleteFile = async (path, cb) => {
    try {
        fs.unlink(path, (error, done) => {
            if (error) {
                throw error
            }
        })
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    deleteFile
}
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const crypto = require("crypto")


const encrypt_password = async (password) => {
    const encryptedPassword = await bcrypt.hash(password, 12)
    return encryptedPassword
}

const decrypt_password = async (password, encrypted) => {
    const passwordSame = await bcrypt.compare(password, encrypted)
    return passwordSame
}

const generate_token = (data) => {
    const token = jwt.sign({ data }, process.env.JWT_SECRET, {
        expiresIn: "1hr"
    })
    return token
}

const generate_refresh_token = () => {
    const val = crypto.randomBytes(120);
    const cryptoVal = val.toString("hex");
    return cryptoVal;
}

module.exports = {
    encrypt_password,
    decrypt_password,
    generate_token,
    generate_refresh_token
}
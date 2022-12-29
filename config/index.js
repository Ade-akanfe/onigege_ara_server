module.exports = {
    port: process.env.PORT,
    salt_round: process.env.SALT_ROUND,
    jwt_secret: process.env.JWT_SECRET,
    mongodb_connection: process.env.NODE_ENV === "production" ? process.env.MONGODB_CONNECTION_STRING : process.env.LOCAL_MONGODB_CONNECTION,
    local_client_url: process.env.LOCAL_CLIENT_URL,
    remote_client_url: process.env.REMOTE_CLIENT_URL,
    local_server_url: process.env.LOCAL_SERVER_URL,
    remote_server_url: process.env.REMOTE_SERVER_URL,
    allowed_domains: process.env.NODE_ENV === "production" ? [
        process.env.REMOTE_CLIENT_URL,
        process.env.REMOTE_SERVER_URL
    ] : [
        process.env.LOCAL_CLIENT_URL,
        process.env.LOCAL_SERVER_URL
    ]
}
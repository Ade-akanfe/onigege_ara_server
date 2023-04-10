const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_KEY_SECRET
});



const uploader = async (file, folder) => {
  try {
    const uploaded = await cloudinary.uploader.upload(file, { folder, resource_type: 'image' });
    return uploaded
  }
  catch (error) {
    throw error
  }
}

module.exports = uploader;
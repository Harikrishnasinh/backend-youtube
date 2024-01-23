import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

// cloudinary is used in codeatnow account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localpath) => {
  try {
    if (!localpath) return null;

    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localpath);
    return response;
  } catch (error) {
    fs.unlinkSync(localpath);
    return null;
  }
};
export { uploadToCloudinary };

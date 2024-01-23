import { Router } from "express";
import { register } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();
router
  .route("/register")
  .post(upload.fields([{ name: "avatar" }, { name: "coverimage" }]), register);

export { router };

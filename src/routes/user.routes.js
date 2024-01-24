import { Router } from "express";
import {
  login,
  loogout,
  refershAccessToken,
  register,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router
  .post(
    "/register",
    upload.fields([{ name: "avatar" }, { name: "coverimage" }]),
    register
  )
  .post("/login", login)
  .post("/logout", verifyJWT, loogout)
  .post("/refresh-token", refershAccessToken);
export { router };

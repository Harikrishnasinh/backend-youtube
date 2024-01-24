import { Router } from "express";
import {
  changeCurrentPassword,
  currentUser,
  getChannelSub,
  getWatchHistory,
  login,
  loogout,
  refershAccessToken,
  register,
  updateAvatar,
  updateCoverImage,
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
  .post("/refresh-token", refershAccessToken)
  .post("/update-password", verifyJWT, changeCurrentPassword)
  .post("/current-user", verifyJWT, currentUser)
  .post("/update-avatar", verifyJWT, upload.single("avatar"), updateAvatar)
  .post(
    "/update-cover",
    verifyJWT,
    upload.single("coverimage"),
    updateCoverImage
  )
  .get("/channel-sub/:username", verifyJWT, getChannelSub)
  .post("/watch-history", verifyJWT, getWatchHistory);
export { router };

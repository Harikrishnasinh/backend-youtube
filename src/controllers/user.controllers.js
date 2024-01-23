import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";

export const register = asyncHandler(async (request, response, next) => {
  const { username, fullname, email, password } = request.body;
  // validation for every field is preesent or not
  if (
    [username, email, password, fullname].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All Fields are required");
  } else {
    const userExist = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (userExist) {
      throw new apiError(409, "User already exist");
    } else {
      const avatarPath = request.files.avatar[0].path;
      // const coverimagePath = request.files.coverimage[0].path;
      let coverimagePath;
      if (
        request.files &&
        Array.isArray(request.files.coverimage) &&
        request.files.coverimage.length > 0
      ) {
        coverimagePath = request.files.coverimage[0].path;
      }
      console.log(coverimagePath);
      if (!avatarPath) throw new apiError(400, "avatar is required");
      const uploadOnCloudinaryPath = await uploadToCloudinary(avatarPath);
      const uploadOnCloudinaryCoverImage = await uploadToCloudinary(
        coverimagePath
      );

      const UserR = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: uploadOnCloudinaryPath.url,
        coverimage: uploadOnCloudinaryCoverImage?.url || "",
      });
      const createUser = await User.findById(UserR._id).select(
        "-password -refreshtoken"
      );
      if (!createUser) {
        throw new apiError(
          500,
          "something went wrong while registering the user"
        );
      }
      response.json(new apiResponse(200, "Registered Succesfully", createUser));
    }
  }
});

import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
// independent method to make the access and refresh token
const generateAccessTokenAndRefreshToken = async (userId) => {
  // generate refreshToken
  const user = await User.findById(userId);
  if (!user)
    throw new apiError(
      401,
      "something went wrong while fetching the user at gereate access token"
    );
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  if (!refreshToken)
    throw new apiError(401, "error while making the refresh token");
  user.refreshtoken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const register = asyncHandler(async (request, response) => {
  const { username, fullname, email, password } = request.body;
  // validation for every field is preesent or not
  if (
    [username, email, password, fullname].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All Fields are required");
  }

  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (userExist) {
    throw new apiError(409, "User already exist");
  }
  const avatarPath = request.files.avatar[0].path;
  let coverimagePath;
  if (
    request.files &&
    Array.isArray(request.files.coverimage) &&
    request.files.coverimage.length > 0
  ) {
    coverimagePath = request.files.coverimage[0].path;
  }
  if (!avatarPath) throw new apiError(400, "avatar is required");
  const uploadOnCloudinaryPath = await uploadToCloudinary(avatarPath);
  const uploadOnCloudinaryCoverImage = await uploadToCloudinary(coverimagePath);

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
    throw new apiError(500, "something went wrong while registering the user");
  }
  response.json(new apiResponse(200, "Registered Succesfully", createUser));
});

const login = asyncHandler(async (request, response) => {
  const { username, email, password } = request.body;
  // find the user with username
  // check the password
  // generate access and refresh token
  // send cookie

  const user = await User.findOne({ username });
  // user verification
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const passwordVerification = await user.isPasswordCorrect(password);

  // password verification
  if (!passwordVerification) {
    throw new apiError(401, "password not match");
  }

  // accessToken and refreshToken
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return response
    .status(200)
    .cookie("refreshtoken", refreshToken, options)
    .cookie("accesstoken", accessToken, options)
    .json(
      new apiResponse(200, "Logged in succesfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const loogout = asyncHandler(async (request, response) => {
  console.log(request.user._id);
  const updateUser = await User.findByIdAndUpdate(
    { _id: request.user._id },
    {
      $set: { refreshtoken: "" },
    },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  response
    .status(200)
    .clearCookie("refreshtoken", options)
    .clearCookie("accesstoken", options)
    .json({ updateUser });
});

const refershAccessToken = asyncHandler(async (request, response) => {
  const incomingRefreshToken = request.cookies.refreshtoken;
  if (!incomingRefreshToken) {
    throw new apiError(403, "Token Not Found");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apiError(403, "user not eligible for this request");
    }
    if (incomingRefreshToken !== user?.refreshtoken) {
      throw new apiError(401, "Token expired");
    }
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    response
      .status(200)
      .cookie("accesstoken", accessToken, options)
      .cookie("refreshtoken", refreshToken, options)
      .json(
        new apiResponse(200, "Token generated succesfully", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    throw new apiError(401, "invalid refresh token");
  }
});
export { register, login, loogout, refershAccessToken };

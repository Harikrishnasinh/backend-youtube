import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

const changeCurrentPassword = asyncHandler(async (request, response) => {
  try {
    const { oldPassword, password } = request.body;
    const user = await User.findById(request.user?._id);
    if (!user) {
      throw new apiError(402, "User not valid");
    }
    const validatePassword = await user.isPasswordCorrect(oldPassword);
    if (!validatePassword) throw new apiError(401, "Password not valid");
    user.password = password;
    await user.save({ validateBeforeSave: false });
    return response
      .status(200)
      .json(new apiResponse(200, "password updated succesfully"));
  } catch (error) {
    throw new apiError(401, error?.message || "something went wrong");
  }
});

const currentUser = asyncHandler(async (request, response) => {
  return response
    .status(200)
    .json(new apiResponse(200, "data got succesfully", request.user));
});

const updateAvatar = asyncHandler(async (request, response) => {
  const avatarPath = request.file?.path;
  const avatar = await uploadToCloudinary(avatarPath);
  const updatedAvatar = await User.findByIdAndUpdate(
    request.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  );
  if (!updatedAvatar) {
    throw new apiError(
      401,
      "Something went wrong while updating the avatar to cloudinary"
    );
  }
  return response
    .status(200)
    .json(new apiResponse(200, "updated succesfully", updatedAvatar));
});

const updateCoverImage = asyncHandler(async (request, response) => {
  const coverimagePath = request.file?.path;
  const coverimage = await uploadToCloudinary(coverimagePath);
  const updatedCoverImage = await User.findByIdAndUpdate(
    request.user._id,
    { $set: { coverimage: coverimage.url } },
    { new: true }
  );
  if (!updatedCoverImage) {
    throw new apiError(
      401,
      "Something went wrong while updating the avatar to cloudinary"
    );
  }
  return response
    .status(200)
    .json(new apiResponse(200, "updated succesfully", updatedCoverImage));
});

const getChannelSub = asyncHandler(async (request, response) => {
  const { username } = request.params;
  if (!username?.trim()) {
    throw new apiError(401, "Username is not proper");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscribes",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscribes",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribed",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedTo: {
          $size: "$subscribed",
        },
        // for button of the subscribe button to hide and show as per subscribe or not
        isSubscribed: {
          $cond: {
            if: { $in: [request.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedTo: 1,
        isSubscribed: 1,
        avatar: 1,
        coverimage: 1,
        email: 1,
      },
    },
  ]);
  response.json(channel);
  // response.status(200, new apiResponse(200, "done", channel));
});

const getWatchHistory = asyncHandler(async (request, response) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(request.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return response
    .status(200)
    .json(new apiResponse(200, "done", user[0].WatchHistory));
});

export {
  register,
  login,
  loogout,
  refershAccessToken,
  changeCurrentPassword,
  currentUser,
  updateAvatar,
  updateCoverImage,
  getChannelSub,
  getWatchHistory,
};

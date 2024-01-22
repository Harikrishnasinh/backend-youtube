import mongoose, { Schema } from 'mongoose'
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: true,
            trim: true
        },
        avatar: {
            type: String,//cloudinary url as string
            required: true,
        },
        coverimage: {
            type: String,//cloudinary url as string
        },
        password: {
            type: String,
            required: true
        },
        watchedhistory: [{
            type: mongoose.Schema.ObjectId,
            ref: "Video"
        }]
    },
    {
        timestamps: true
    }
)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function () {
    jwt.sign({
        _id: this._id,
        username: this.username,
        fullname: this.fullname
    },
        process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY
    })
}
userSchema.methods.generateRefreshToken = function () {
    jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY
    })
}
export const User = mongoose.model("User", userSchema)
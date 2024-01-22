import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async () =>{
    // console.log(process.env.MONGODB_URL)
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`mongoDb connected`)
    } catch (error) {
        console.error(`error is`,error)
        throw error 
    }
}

export default connectDb
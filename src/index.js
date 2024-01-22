import connectDb from "./db/index.js";
import dotenv from "dotenv"
import { app } from "./app.js";

// configuration for dotenv
dotenv.config({
    path: './.env'
})

connectDb()
    .then(() => {
        app.listen(`${process.env.PORT}`,()=>{
            console.log(`port is listening on ${process.env.PORT}`)
        })
    })
    .catch((error) => {
        console.error(error)
        throw error
    })
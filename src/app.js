import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from "./routes/user.routes.js";
import bodyParser from "body-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/api/v1/users", router);
export { app };

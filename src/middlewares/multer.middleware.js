import multer from "multer";

// const app = express()

const storage = multer.diskStorage({
  destination: "././public/temp",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Set the filename
  },
});
export const upload = multer({ storage: storage });

import multer from "multer";
import path from "path";
import crypto from "crypto";

export default multer({
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, "..", "..", "uploads"),
    filename(request, file, cb) {
      const hash = crypto.randomBytes(6).toString("hex");
      const filename = `${hash}-${file.originalname}`;

      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (request, file, cb) => {
    const allowedMimes = ["image/png", "image/jpg", "image/jpeg"];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type Invalid"));
    }
  },
});

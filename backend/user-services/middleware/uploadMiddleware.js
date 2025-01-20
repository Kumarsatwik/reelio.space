import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {// Log field name
    if (file.fieldname !== "chunk") {
      console.error(`Unexpected field: ${file.fieldname}`);
      return cb(new Error("Unexpected field"));
    }
    cb(null, true);
  },
});

export default upload;

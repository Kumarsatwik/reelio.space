import express from "express";
import { register, login, updateProfile } from "../controllers/authController.js";
import auth from "../middleware/auth.js";
const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
});
router.put("/profile", auth, updateProfile)

export default router;

import jwt from "jsonwebtoken";
import User from "../models/User.js";

const userModel = new User();

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const user = await userModel.create({ email, password, name });
    const token = jwt.sign({ userId: user.email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    if (error.message === "Email already registered") {
      return res.status(409).json({ error: error.message });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const isValidPassword = await userModel.validatePassword(
      password,
      user.password
    );
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign({ userId: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Update cookie settings
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1 * 60 * 60 * 1000,
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json({
      user: {
        email: req.user.email,
        name: req.user.name,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Error fetching profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { email } = req.user;
    const user = await userModel.updateProfile(email, req.body);
    res.json({ user });
  } catch (error) {
    console.error("Update Profile error:", error);
    res.status(500).json({ error: "Error updating profile" });
  }
};

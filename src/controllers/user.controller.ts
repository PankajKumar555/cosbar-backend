import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const getAllUsers = async (
  _req: Request,
  res: Response
): Promise<any> => {
  try {
    const allUser = await User.find().lean();
    return res.status(200).json(allUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const userData = {
      id: user._id,
      name: user.username,
      email: user.email,
    };
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(userData, process.env.JWT_SECRET!, {
      expiresIn: "24h",
    });
    return res.status(200).json({ token, message: "Login successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, email, password } = req.body;

    const updateData: any = {};

    if (username) {
      updateData.username = username;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "User updated successfully", data: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }
    const user = await User.findOne({ _id: id });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const deleteUser = await User.deleteOne({ _id: id });

    if (!deleteUser) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting User:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

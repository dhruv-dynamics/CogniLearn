import { registerService, loginService } from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//
// REGISTER CONTROLLER (Auto-Login After Register)
//
export const registerUser = async (req, res, next) => {
  try {
    // Step 1: Create user
    await registerService(req.body);

    // Step 2: Immediately log them in to generate token
    const data = await loginService({
      email: req.body.email,
      password: req.body.password,
    });

    // data should contain: { user, token }
    res.status(201).json(
      new ApiResponse(201, "User registered & logged in successfully", data)
    );
  } catch (error) {
    next(error);
  }
};

//
// LOGIN CONTROLLER
//
export const loginUser = async (req, res, next) => {
  try {
    const data = await loginService(req.body);

    res.status(200).json(
      new ApiResponse(200, "Login successful", data)
    );
  } catch (error) {
    next(error);
  }
};

//
// GET CURRENT LOGGED-IN USER
//
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json(
      new ApiResponse(200, "User fetched successfully", req.user)
    );
  } catch (error) {
    next(error);
  }
};

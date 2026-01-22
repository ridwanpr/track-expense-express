import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { ResponseError } from "../../shared/errors/response.error.js";
import type { AuthenticatedRequest } from "../../shared/types/request.type.js";
import { stringToNumber } from "../../shared/utils/stringToNumber.js";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  create = async (req: Request, res: Response) => {
    const { data, accessToken, refreshToken } = await this.service.registerUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Register success",
      data,
      accessToken,
    });
  };

  login = async (req: Request, res: Response) => {
    const { data, accessToken, refreshToken } = await this.service.loginUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login success",
      data,
      accessToken,
    });
  };

  logout = async (_req: Request, res: Response) => {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    res.status(200).json({
      message: "Logged out successfully",
    });
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new ResponseError(401, "Not authorized, refresh token invalid");
    }

    const { accessToken, user } = await this.service.refreshUserToken(refreshToken);

    res.status(200).json({
      message: "Refresh token success",
      data: user,
      accessToken,
    });
  };

  me = async (req: AuthenticatedRequest, res: Response) => {
    const reqUserId = req.user?.userId;

    if (!reqUserId) {
      throw new ResponseError(401, "User token unauthorized, please re-login");
    }

    const userId = stringToNumber(reqUserId, 400, "User id not valid");

    const user = await this.service.getUserInfo(userId);

    res.status(200).json({
      message: "Successfully get user info",
      data: user,
    });
  };
}

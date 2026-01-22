import { ResponseError } from "../../shared/errors/response.error.js";
import type { PasswordPort } from "../../shared/services/password.port.js";
import type { TokenPort } from "../../shared/services/token.port.js";
import type { AuthRepository } from "./auth.repository.port.js";
import type { LoginUserDTO, RegisterUserDTO } from "./auth.schema.js";

export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly passwordService: PasswordPort,
    private readonly tokenService: TokenPort,
  ) {}

  async registerUser(data: RegisterUserDTO) {
    const exists = await this.repo.findByUsername(data.username);
    if (exists) {
      throw new ResponseError(401, "User already exists");
    }

    const hashedPassword = await this.passwordService.hash(data.password, 11);

    const newUser = await this.repo.create({
      ...data,
      password: hashedPassword,
    });

    const payload = { userId: newUser.id };
    const accessToken = await this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(payload);

    return { data: newUser, accessToken, refreshToken };
  }

  async loginUser(data: LoginUserDTO) {
    const user = await this.repo.findByUsername(data.username);
    if (!user) {
      throw new ResponseError(401, "Invalid Credentials");
    }

    const isPasswordMatch = await this.passwordService.compare(data.password, user.password);

    if (!isPasswordMatch) {
      throw new ResponseError(401, "Invalid Credentials");
    }

    const payload = { userId: user.id };
    const accessToken = await this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(payload);

    return {
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshUserToken(refreshToken: string) {
    const { payload } = await this.tokenService.verifyJWT(refreshToken);
    const userId = Number(payload.userId);
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new ResponseError(401, "User not Found");
    }

    const newAccessToken = await this.tokenService.generateAccessToken({
      userId: user.id.toString(),
    });

    return {
      accessToken: newAccessToken,
      user,
    };
  }

  async getUserInfo(userId: number) {
    const user = this.repo.findUserById(userId);

    if (!user) {
      throw new ResponseError(401, "User not Found");
    }

    return user;
  }
}

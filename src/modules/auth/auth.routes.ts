import { Router } from "express";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { loginUserSchema, registerUserSchema } from "./auth.schema.js";
import type { AuthController } from "./auth.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import type { TokenService } from "../../shared/services/token.service.js";

export function createAuthRoutes(controller: AuthController, tokenService: TokenService) {
  const router = Router();

  const protectedAuth = authMiddleware(tokenService);

  router.post("/auth/register", validate(registerUserSchema), controller.create);

  router.post("/auth/login", validate(loginUserSchema), controller.login);

  router.post("/auth/logout", controller.logout);
  router.post("/auth/refresh", controller.refresh);

  router.get("/auth/me", protectedAuth, controller.me);

  return router;
}

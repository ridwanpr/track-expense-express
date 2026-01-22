import express from "express";
import cookieParser from "cookie-parser";
import { trimMiddleware } from "./shared/middleware/trim.middleware.js";
import { errorMiddleware } from "./shared/middleware/error.middleware.js";
import { createContainer } from "./container.js";
import { createAuthRoutes } from "./modules/auth/auth.routes.js";
import { createWorkspaceRoutes } from "./modules/workspace/workspace.routes.js";
import { createCategoryRoutes } from "./modules/category/categoy.routes.js";
import { createPermissionRoute } from "./modules/permission/permission.routes.js";
import { createRoleRoutes } from "./modules/role/role.routes.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(cookieParser());

app.use(trimMiddleware);

const container = createContainer();

const authRouter = createAuthRoutes(container.authController, container.tokenService);
const workspaceRouter = createWorkspaceRoutes(
  container.workspaceController,
  container.tokenService,
);
const categoryRouter = createCategoryRoutes(container.categoryController, container.tokenService);
const permissionRouter = createPermissionRoute(
  container.permissionController,
  container.tokenService,
);
const roleRouter = createRoleRoutes(container.roleController, container.tokenService);

app.use("/api", authRouter);
app.use("/api", workspaceRouter);
app.use("/api", categoryRouter);
app.use("/api", permissionRouter);
app.use("/api", roleRouter);

app.use((_req, res, _next) => {
  res.status(404).json({
    errors: "URI Not Found",
  });
});

app.use(errorMiddleware);

export default app;

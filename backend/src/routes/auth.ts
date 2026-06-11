import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db";
import { validate } from "../middleware/validate";
import { loginSchema, LoginInput } from "../schemas/login.schema";

const router = Router();

// Hash de relleno: cuando el username no existe igual se ejecuta un compare,
// para que el tiempo de respuesta no delate qué usuarios son válidos.
const DUMMY_HASH = "$2b$12$xFoGcAqw2UDT1rxtxHUDVew7t7tH41N8wl8Au64ZijjWm5mkNI1Ca";

router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body as LoginInput;

      const result = await pool.query<{
        id: string;
        username: string;
        password_hash: string;
      }>(
        "SELECT id, username, password_hash FROM admin_users WHERE username = $1",
        [username],
      );

      const envAdminUsername = process.env.ADMIN_USERNAME;
      const envAdminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

      let user = result.rows[0];
      let passwordMatch = false;

      if (user) {
        passwordMatch = await bcrypt.compare(password, user.password_hash);
      }

      // Fallback para entornos donde el usuario admin aún no fue insertado en DB.
      if (
        !passwordMatch &&
        envAdminUsername &&
        envAdminPasswordHash &&
        username === envAdminUsername
      ) {
        passwordMatch = await bcrypt.compare(password, envAdminPasswordHash);
        if (passwordMatch) {
          user = {
            id: "env-admin",
            username: envAdminUsername,
            password_hash: envAdminPasswordHash,
          };
        }
      } else if (!user) {
        await bcrypt.compare(password, DUMMY_HASH);
      }

      if (!passwordMatch || !user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        { sub: user.id, username: user.username },
        process.env.JWT_SECRET!,
        { expiresIn: "8h", algorithm: "HS256" },
      );

      return res.status(200).json({ token, expiresIn: 28800 });
    } catch (err) {
      next(err);
    }
  },
);

export default router;

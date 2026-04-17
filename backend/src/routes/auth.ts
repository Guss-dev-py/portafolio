import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db";

const router = Router();

router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body as {
        username?: string;
        password?: string;
      };

      if (!username || !password) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

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
      }

      if (!passwordMatch || !user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        { sub: user.id, username: user.username },
        process.env.JWT_SECRET!,
        { expiresIn: "8h" },
      );

      return res.status(200).json({ token, expiresIn: 28800 });
    } catch (err) {
      next(err);
    }
  },
);

export default router;

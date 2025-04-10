import { Router, Request, Response } from "express";
import { db } from "../db";
import { NewUser, users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

const authRouter = Router();

interface SignUpBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

authRouter.post(
  "/signup",
  async (req: Request<{}, {}, SignUpBody>, res: Response) => {
    try {
      const { name, email, password } = req.body;
      //check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser.length) {
        res
          .status(400)
          .json({ msg: "User with the same email already exists!" });
        return;
      }
      //hashed password
      const hashedPassword = await bcryptjs.hash(password, 8);

      //create a new user and store in db

      const newUser: NewUser = {
        name: name,
        email: email,
        password: hashedPassword,
      };
      const [user] = await db.insert(users).values(newUser).returning();
      res.status(201).json(user);
    } catch (e) {
      res.status(500).json({ error: e });
    }
  }
);

authRouter.post(
  "/login",
  async (req: Request<{}, {}, SignUpBody>, res: Response) => {
    try {
      const { email, password } = req.body;
      //check if user already exist
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!existingUser) {
        res.status(400).json({ msg: "User with this email does not exist!" });
        return;
      }

      const isMatched = await bcryptjs.compare(password, existingUser.password);

      if (!isMatched) {
        res.status(400).json({ msg: "Incorrect Password" });
        return;
      }

      res.json(existingUser);
    } catch (e) {
      res.status(500).json({ error: e });
    }
  }
);

authRouter.get("/", (req, res) => {
  res.send("Hey there! from auth");
});

export default authRouter;

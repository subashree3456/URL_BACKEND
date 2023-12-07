import dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";
import cors from "cors";
import randomstring from "randomstring";
import nodemailer from "nodemailer";
import {
  getUser,
  getUserByName,
  getUserpasstoken,
  hashingpassword,
  passtokenset,
  updateuserpassDetails,
} from "./helper.js";
import express from "express";
const app = express();
const PORT = process.env.PORT || '8000';
const MONGO_URL = process.env.MONGO || "mongodb://127.0.0.1:27017";

app.use(express.json());
app.use(cors());

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("dataBase Is Connected...!");
  return client;
}

export const client = await createConnection();

app.get("/", function (request, response) {
  response.send("hello there.... from node 🙋‍♂️, 🌏 🎊✨🤩");
});

app.post("/signup", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(422).json({ error: "Please Fill the properties" });
  }

  try {
    const emailExist = await client
      .db("company")
      .collection("staff")
      .findOne({ email: email });
    const usernameExist = await client
      .db("company")
      .collection("staff")
      .findOne({ username: username });
    const hashpass = await hashingpassword(password);
    const user = { email, username, password: hashpass };
    const signUp = await client
      .db("company")
      .collection("staff")
      .insertOne(user);
    if (emailExist) {
      return res.status(422).json({ error: "Email is already exist" });
    }
    if (usernameExist) {
      return res.status(422).json({ error: "Username is already exist" });
    }
    if (signUp) {
      return res.status(200).json({ message: "user created successfully" });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const { name, pass } = req.body;

  const userFromDB = await getUserByName(name);
  if (!userFromDB) {
    res.status(400).send({ message: "invalid credentials" });
  } else {
    const storedDBPassword = userFromDB.password;
    const isPasswordCheck = await bcrypt.compare(pass, storedDBPassword);
    if (isPasswordCheck) {
      res.status(200).send({ message: "Sucessfully Login" });
    } else {
      res.status(400).send({ message: "invalid credentials" });
    }
  }
});

app.post("/forgotPassword", async (req, res) => {
  try {
    let randomString = randomstring.generate();
    const email = req.body.email;
    console.log(email);
    const isUserExist = await getUser(email);
    console.log(isUserExist);
    if (!isUserExist) {
      res.status(401).send({ error: "Invalid Credentails" });
    } else {
      async function main() {
        let transporter = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com",

          secure: false,
          auth: {
            user: "yokeshdhanablan@gmail.com",
            pass: "unptqcckajjquikp",
          },
        });
        let mailOptions = await transporter.sendMail({
          from: `"mass"<yokeshdhanablan@gmail.com>`,
          to: email,
          subject: "Reset Password - Company",
          html: `<h4>Hello,</h4><p>We've Received a Request To Reset The Password For The Staff Account.You Can Reset The Password By Clicking The Link Below.
                <a href=${process.env.FRONTEND_URL}/resetpassword/${randomString}>Click To Reset Your Password</a></p>`,
        });
        console.log(mailOptions.messageId);
      }
      main();

      const isPassToken = await passtokenset(email, randomString);

      res.status(200).send({ msg: "email sended successfully" });
    }
  } catch (error) {
    res.status(500).send({ error: "internet error" });
  }
});

app.post("/resetpassword", async function (req, res) {
  try {
    const pass_token = req.body.pass_token;
    const password = req.body.password;
    const confirmpassword = req.body.confirmpassword;
    const isuserpasstokenexist = await getUserpasstoken(pass_token);
    if (!isuserpasstokenexist) {
      res.status(401).send({ error: "invalid credentials" });
    } else {
      if (password === confirmpassword) {
        const hashpass = await hashingpassword(password);

        const ispasstoken = await updateuserpassDetails(pass_token, hashpass);

        res.status(200).send({ msg: "password set successfully" });
      } else {
        res.status(200).send({ error: "confirmed password not match" });
      }
    }
  } catch (error) {
    res.status(500).send({ error: "interval error" });
  }
});



app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));

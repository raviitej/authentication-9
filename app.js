const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeServerAndDbConnection = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3004, () => {});
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeServerAndDbConnection();

//API 1
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const usernameQuery = `SELECT * FROM user WHERE username='${username}';`;
  const userData = await db.get(usernameQuery);
  if (userData !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const dbQuery = `INSERT INTO user(username,name,password,gender,location) VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(dbQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `SELECT * FROM user WHERE username='${username}';`;
  const userData = await db.get(userQuery);
  if (userData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, userData.password);
    if (checkPassword === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `SELECT * FROM user WHERE username='${username}';`;
  const userData = await db.get(userQuery);
  const checkPassword = await bcrypt.compare(oldPassword, userData.password);
  if (checkPassword === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = `UPDATE user SET password='${updatePassword}' WHERE username='${username}';`;
      await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;

const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "userData.db");
let db = null;
const result = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("serving running");
    });
  } catch (error) {
    console.log(`db error ${error.message}`);
    process.exit(1);
  }
};
result();
//create api using create login

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hastedpass = await bcrypt.hash(request.body.password, 10);
  const select = `SELECT * FROM user WHERE username='${username}'`;
  const dbuser = await db.get(select);
  console.log(password.length);
  if (dbuser === undefined) {
    const createuser = `INSERT INTO user(username,name,password,gender,location)
                            values(
                                '${username}',
                              '${name}',
                              '${hastedpass}',
                              '${gender}',
                              '${location}'

                            )`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(createuser);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const query = `SELECT * FROM user WHERE username='${username}'`;
  const dbuser = await db.get(query);
  if (dbuser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const ispassword = await bcrypt.compare(password, dbuser.password);
    if (ispassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//update
app.put("/change-password", async (request, response) => {
  const { username, newPassword, oldPassword } = request.body;
  const query = `SELECT * FROM user WHERE username='${username}'`;
  const dbuser = await db.get(query);
  // console.log(newPassword);
  console.log(oldPassword);
  console.log(dbuser.password);
  const ispassword = await bcrypt.compare(oldPassword, dbuser.password);
  //const ispassword = dbuser.password === hashedPassword;
  console.log(ispassword);
  if (ispassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatepw = `UPDATE user SET 
            password='${hashedPassword}'
           WHERE username='${username}'
            `;
      await db.run(updatepw);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;

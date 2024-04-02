const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const myPlaintextPassword = "s0//P4$$w0rD";
const someOtherPlaintextPassword = "not_bacon";
const app = express();
const port = process.env.PORT || 5000;

//! middleware
app.use(cors());
app.use(express.json());
// ${process.env.DB_USER}

//! connect with mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u5hejig.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    //! all collections
    const registerUserCollection = client
      .db("devlab")
      .collection("registerInfo");
    //! for register api
    app.post("/register", async (req, res) => {
      const { userName, email, role, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await registerUserCollection.insertOne({
        userName,
        email,
        role,
        password: hashedPassword,
      });
      res.send(result);
    });
    //!for login api
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;
      console.log(email, password);
      const user = await registerUserCollection.findOne({ email });
      console.log(user);
      if (!user) return res.status(400).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        {
          id: user._id,
          userName: user.userName,
          email: user.email,
          role: user.role,
        },
        process.env.SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );
      res.json({ token });
    });
    //! auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      res.send(user);
    });
    //! Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//! initially run the server
app.get("/", (req, res) => {
  res.send("Devlab server is running");
});
app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
});

// "dev": "nodemon src/app.js",

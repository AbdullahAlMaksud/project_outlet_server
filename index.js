const express = require("express");
const cors = require('cors');
const app = express();
const port = 3000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hjp9r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    // Send a ping to confirm a successful connection

    //Database and collection

    const database = client.db("outlet");
    const productsCollection = database.collection("products");

    //--------------------------------------------

    app.get("/products", async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();
        res.json(products);
      } catch {
        res.status(500).send("Error fetching products");
      }
    });

    //--------------------------------------------
    app.get("/", (req, res) => {
      res.send("Outlet Server is running...");
    });

    app.listen(port, () => {
      console.log(`Outlet server running on port ${port}`);
    });

    //--------------------------------------------
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

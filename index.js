const express = require("express");
const cors = require("cors");
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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const search = req.query.search || '';
      const sortBy = req.query.sortBy || ''; // new sort parameter

      console.log(`Received page: ${page}, limit: ${limit}, search: ${search}, sortBy: ${sortBy}`);

      const skip = (page - 1) * limit;
      const totalProducts = await productsCollection.countDocuments({ name: { $regex: search, $options: 'i' } });

      // Define sort options
      let sortOptions = {};
      if (sortBy === 'priceAsc') {
        sortOptions = { price: 1 }; // Low to High
      } else if (sortBy === 'priceDesc') {
        sortOptions = { price: -1 }; // High to Low
      } else if (sortBy === 'dateAsc') {
        sortOptions = { created_at: 1 }; // Old to New
      } else if (sortBy === 'dateDesc') {
        sortOptions = { created_at: -1 }; // New to Old
      }

      const products = await productsCollection
        .find({ name: { $regex: search, $options: 'i' } })
        .sort(sortOptions) // Apply sorting
        .skip(skip)
        .limit(limit)
        .toArray();

      const totalPages = Math.ceil(totalProducts / limit);
      res.json({ products, totalProducts, totalPages });
    });

    app.get("/categories", async (req, res) => {
      try {
        const categories = await productsCollection.aggregate([
          { $group: { _id: "$category" } },
          { $project: { _id: 0, category: "$_id" } }
        ]).toArray();
        res.json({ categories: categories.map(cat => cat.category) });
      } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
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

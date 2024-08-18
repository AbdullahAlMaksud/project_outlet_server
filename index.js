const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000; 

app.use(express.json());
app.use(cors());

// MongoDB connection URI
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
    // Database and collections
    const database = client.db("outlet");
    const productsCollection = database.collection("products");
    const bannerCollection = database.collection("bannerData");
    const reviewData = database.collection("customerReview");

    // Product API
    app.get("/products", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const search = req.query.search || "";
        const sortBy = req.query.sortBy || "";
        const category = req.query.category || "";
        const brand = req.query.brand || "";
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 10000;

        const skip = (page - 1) * limit;

        //----Build the query
        const query = {
          name: { $regex: search, $options: "i" },
          ...(category && { category: { $in: category.split(",") } }),
          ...(brand && { brand: { $in: brand.split(",") } }),
          price: { $gte: minPrice, $lte: maxPrice },
        };

        const totalProducts = await productsCollection.countDocuments(query);

        //----Define sort options
        let sortOptions = {};
        if (sortBy === "priceAsc") {
          sortOptions = { price: 1 }; // Low to High
        } else if (sortBy === "priceDesc") {
          sortOptions = { price: -1 }; // High to Low
        } else if (sortBy === "dateAsc") {
          sortOptions = { created_at: 1 }; // Old to New
        } else if (sortBy === "dateDesc") {
          sortOptions = { created_at: -1 }; // New to Old
        }

        const products = await productsCollection
          .find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .toArray();

        const totalPages = Math.ceil(totalProducts / limit);
        res.json({ products, totalProducts, totalPages });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // Categories API
    app.get("/categories", async (req, res) => {
      try {
        const categories = await productsCollection
          .aggregate([
            { $group: { _id: "$category" } },
            { $project: { _id: 0, category: "$_id" } },
          ])
          .toArray();
        res.json({ categories: categories.map((cat) => cat.category) });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // Brands API
    app.get("/brands", async (req, res) => {
      try {
        const brands = await productsCollection
          .aggregate([
            { $group: { _id: "$brand" } },
            { $project: { _id: 0, brand: "$_id" } },
          ])
          .toArray();
        res.json({ brands: brands.map((b) => b.brand) });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // Banner Data API
    app.get("/bannerData", async (req, res) => {
      try {
        const banners = await bannerCollection.find().toArray();
        res.json(banners);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // Customer Review API
    app.get("/reviewData", async (req, res) => {
      try {
        const reviews = await reviewData.find().toArray();
        res.json(reviews);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // Root route to check server status
    app.get("/", (req, res) => {
      res.send("Outlet Server is running...");
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Outlet server running on port ${port}`);
    });

    // Ping the MongoDB deployment
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}

run().catch(console.dir);
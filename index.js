const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware to handle JSON requests
app.use(express.json());

// CORS configuration to allow requests from specific origin
const corsOptions = {
  origin: "http://localhost:5173", // Allow requests from your frontend
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies or other credentials in requests
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));

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
    // Connect the client to the server
    await client.connect();

    // Database and collection
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

        console.log(
          `Received page: ${page}, limit: ${limit}, search: ${search}, sortBy: ${sortBy}, category: ${category}, brand: ${brand}, minPrice: ${minPrice}, maxPrice: ${maxPrice}`
        );

        const skip = (page - 1) * limit;

        // Build the query
        const query = {
          name: { $regex: search, $options: "i" },
          ...(category && { category: { $in: category.split(",") } }),
          ...(brand && { brand: { $in: brand.split(",") } }),
          price: { $gte: minPrice, $lte: maxPrice },
        };

        const totalProducts = await productsCollection.countDocuments(query);

        // Define sort options
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

    // Categories Name API
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

    // Brand Name API
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

    // BannerData Name API
    app.get("/bannerData", async (req, res) => {
      try {
        const banners = await bannerCollection.find().toArray();
        res.json(banners);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
      }
    });
    // CustomerReview Name API
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
  } finally {
    // Ensure that the client will close when you finish/error
    // await client.close(); // Uncomment if you want to close the client when finished
  }
}

run().catch(console.dir);
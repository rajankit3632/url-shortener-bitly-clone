const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
require("dotenv").config();

const app = express();
app.use(express.json());

// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));


// Schema
const urlSchema = new mongoose.Schema({
    shortCode: {
        type: String,
        required: true,
        unique: true
    },
    originalUrl: {
        type: String,
        required: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Url = mongoose.model("Url", urlSchema);


// Create Short URL
app.post("/shorten", async (req, res) => {

    const { originalUrl } = req.body;

    let url = await Url.findOne({ originalUrl });

    if (url) {
        return res.json({
            shortUrl: `${req.headers.host}/${url.shortCode}`
        });
    }

    const shortCode = shortid.generate();

    url = new Url({
        shortCode,
        originalUrl
    });

    await url.save();

    res.json({
        shortUrl: `${req.headers.host}/${shortCode}`
    });
});


// Redirect
app.get("/:shortCode", async (req, res) => {

    const url = await Url.findOne({
        shortCode: req.params.shortCode
    });

    if (url) {

        url.clicks++;
        await url.save();

        return res.redirect(url.originalUrl);

    } else {
        res.status(404).json({
            message: "URL not found"
        });
    }
});


// Analytics
app.get("/analytics/:shortCode", async (req, res) => {

    const url = await Url.findOne({
        shortCode: req.params.shortCode
    });

    if (url) {

        res.json({
            originalUrl: url.originalUrl,
            clicks: url.clicks,
            createdAt: url.createdAt
        });

    } else {
        res.status(404).json({
            message: "URL not found"
        });
    }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
    console.log("Server running on port", PORT)
);

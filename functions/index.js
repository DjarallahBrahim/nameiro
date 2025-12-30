const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");
const Replicate = require("replicate");

// Initialize Replicate with hardcoded token (User provided)
// In a real prod environment, use defineSecret()
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const app = express();

// Allow Cross-Origin requests
app.use(cors({ origin: true }));

// Handle JSON bodies
app.use(express.json());

// ========== PROXY ROUTES ==========
// These routes mirror the Replicate API structure but handle Auth on the server.
// The frontend calls these at /api/replicate/predictions...

// 1. Create Prediction (POST /predictions)
app.post("/predictions", async (req, res) => {
    try {
        const { input, version } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : process.env.REPLICATE_API_TOKEN; // Fallback to default if not provided

        const replicate = new Replicate({ auth: token });

        // Validate
        if (!input || !version) {
            return res.status(400).json({ error: "Missing 'input' or 'version' in body" });
        }

        const prediction = await replicate.predictions.create({
            version: version,
            input: input,
        });

        res.status(201).json(prediction);
    } catch (error) {
        logger.error("Create Prediction Error", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Get Prediction (GET /predictions/:id)
// Used for polling
app.get("/predictions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : process.env.REPLICATE_API_TOKEN;

        const replicate = new Replicate({ auth: token });

        const prediction = await replicate.predictions.get(id);

        res.json(prediction);
    } catch (error) {
        logger.error("Get Prediction Error", error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy Router (for /api/replicate prefix)
const mainRouter = express.Router();
mainRouter.post("/predictions", async (req, res) => {
    try {
        const { input, version } = req.body;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : process.env.REPLICATE_API_TOKEN;

        const replicate = new Replicate({ auth: token });
        const prediction = await replicate.predictions.create({ version, input });
        res.status(201).json(prediction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Atom Appraisal (GET /atom-appraisal)
mainRouter.get("/atom-appraisal", async (req, res) => {
    try {
        const { domain, api_token, user_id } = req.query;
        if (!domain) {
            return res.status(400).json({ error: "Missing 'domain' query parameter" });
        }
        if (!api_token || !user_id) {
            return res.status(400).json({ error: "Missing 'api_token' or 'user_id' parameter. Please configure them in the analysis page." });
        }

        const endpoint = `https://www.atom.com/api/marketplace/domain-appraisal`;
        const url = `${endpoint}?api_token=${api_token}&user_id=${user_id}&domain_name=${domain}`;

        // Note: Atom API likely requires standard fetch, not the Replicate SDK
        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: `Atom API failed: ${text}` });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        logger.error("Atom Appraisal Error", error);
        res.status(500).json({ error: error.message });
    }
});

mainRouter.get("/predictions/:id", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : process.env.REPLICATE_API_TOKEN;

        const replicate = new Replicate({ auth: token });
        const prediction = await replicate.predictions.get(req.params.id);
        res.json(prediction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mount the router at the path we expect from Hosting rewrite
app.use("/api/replicate", mainRouter);
app.use("/api/atom", mainRouter);
// Also allow root access for direct testing or different rewrite configs
app.use("/", mainRouter);


exports.replicateProxy = onRequest({ region: "us-central1" }, app);

// Import required packages
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Create an Express application
const app = express();

// --- Configuration ---
// The port will be provided by the hosting environment (like Koyeb) or default to 3001 for local testing.
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY;
const MODEL_NAME = 'gemini-1.5-flash-latest';
const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

// --- Middleware ---
// Enable CORS for all routes, allowing requests from any origin
app.use(cors());
// Parse JSON bodies for incoming requests
app.use(express.json());

// --- Health Check Route ---
// This endpoint is for the hosting platform (Koyeb) to check if the service is alive.
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Proxy server is running.' });
});

// --- API Route ---
// This is the endpoint your frontend application will call
app.post('/api/generate', async (req, res) => {
  // Check if the API key is configured on the server
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  // --- NEW: Log the incoming user request ---
  // This line will print the user's prompt to your Koyeb server logs.
  console.log("New user request received:", JSON.stringify(req.body, null, 2));
  // -----------------------------------------

  try {
    // Forward the request body received from the client to the Google AI API
    const response = await axios.post(GOOGLE_API_URL, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Send the response from Google back to the client
    res.json(response.data);

  } catch (error) {
    // Handle potential errors
    console.error('Error proxying to Google AI:', error.response ? error.response.data : error.message);
    
    // Send a detailed error message back to the client
    if (error.response) {
      res.status(error.response.status).json({
        error: 'An error occurred while communicating with the Google AI API.',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error.',
        details: error.message
      });
    }
  }
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Proxy server is running and listening on port ${PORT}`);
});

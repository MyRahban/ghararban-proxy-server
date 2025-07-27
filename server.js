// Import required packages
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Create an Express application
const app = express();

// --- Configuration ---
const PORT = process.env.PORT || 3001; 
const RAHBAN_API_KEY = process.env.RAHBAN_API_KEY;
const GHARARBAN_API_KEY = process.env.GHARARBAN_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash-latest';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.status(200).send('Proxy server is running and healthy!');
});

// --- API Route ---
app.post('/api/generate', async (req, res) => {
  // The client now sends an object with 'assistant' and 'payload'
  const { assistant, payload } = req.body;

  let apiKey;
  // Select the correct API key based on the assistant type from the client
  if (assistant === 'rahban') {
    apiKey = RAHBAN_API_KEY;
  } else if (assistant === 'ghararban') {
    apiKey = GHARARBAN_API_KEY;
  } else {
    return res.status(400).json({ error: 'Assistant type not specified or invalid.' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: `API key for ${assistant} is not configured on the server.` });
  }

  const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  try {
    // Forward the original payload to Google
    const response = await axios.post(GOOGLE_API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error proxying for ${assistant}:`, error.response ? error.response.data : error.message);
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

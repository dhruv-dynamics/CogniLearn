import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY.trim();

async function getAvailableModels() {
  try {
    console.log("🔍 Checking available models for your API key...");
    
    // Google API ka models list endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await axios.get(url);
    
    console.log("\n✅ Models found:");
    const models = response.data.models;
    
    models.forEach(m => {
      console.log(`- Name: ${m.name} | Methods: ${m.supportedGenerationMethods}`);
    });

  } catch (error) {
    console.error("\n❌ Error fetching models:");
    console.error(error.response?.data || error.message);
  }
}

getAvailableModels();
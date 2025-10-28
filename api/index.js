import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Setup CORS — allow only your frontend domain
const allowedOrigin = (process.env.CLIENT_URL || "").replace(/\/$/, "");
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin === allowedOrigin) return callback(null, true);
      console.warn("❌ Blocked CORS request from:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["POST"],
  })
);

// ✅ Initialize Hugging Face with secret token from environment variable
const hf = new HfInference(process.env.HF_ACCESS_TOKEN);

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page.
`;

// ✅ POST /api/mistral — main endpoint
app.post("/api/mistral", async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: "Missing or invalid ingredients array" });
    }

    const ingredientsString = ingredients.join(", ");

    // ✅ Use `conversational` for free-tier Mistral models
    const response = await hf.conversational({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      inputs: {
        past_user_inputs: [],
        generated_responses: [],
        text: `I have ${ingredientsString}. Please give me a recipe you'd recommend I make!`,
      },
      parameters: {
        temperature: 0.7,
        max_new_tokens: 600,
      },
    });

    const recipe =
      response?.generated_text ||
      response?.[0]?.generated_text ||
      "No recipe found.";

    res.json({ recipe });
  } catch (err) {
    console.error("❌ Hugging Face API Error:", err);
    res.status(500).json({
      error: "Error fetching recipe from Mistral",
      details: err.message,
    });
  }
});

// ✅ Export for Vercel
export default app;

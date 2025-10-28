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

app.post("/api/mistral", async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: "Missing or invalid ingredients array" });
    }

    const ingredientsString = ingredients.join(", ");

    // Manual call to the conversational endpoint
    const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          past_user_inputs: [],
          generated_responses: [],
          text: `You are a recipe assistant. I have ${ingredientsString}. Suggest a recipe in markdown.`,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ HF API HTTP Error:", errText);
      return res.status(500).json({ error: "Hugging Face API call failed", details: errText });
    }

    const data = await response.json();
    const recipe = data?.generated_text || "No recipe found.";
    res.json({ recipe });
  } catch (err) {
    console.error("❌ Hugging Face API Error:", err);
    res.status(500).json({ error: "Error fetching recipe from Mistral", details: err.message });
  }
});


// ✅ Export for Vercel
export default app;

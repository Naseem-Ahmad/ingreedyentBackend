import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

dotenv.config();

const app = express();
app.use(express.json());

// Allow only your deployed frontend origin (set CLIENT_URL env)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["POST", "GET"],
  })
);

// Initialize Hugging Face client
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

    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.2", // ✅ lighter, free-tier friendly
      inputs: `
${SYSTEM_PROMPT}

User: I have ${ingredients.join(", ")}. Please give me a recipe you'd recommend!
Assistant:
`,
      parameters: {
        max_new_tokens: 600,
        temperature: 0.7,
      },
    });

    const recipe = response.generated_text || "No recipe found.";
    res.json({ recipe });
  } catch (err) {
    console.error("❌ Hugging Face API Error:", err);
    res.status(500).json({ error: "Error fetching recipe from Mistral", details: err.message });
  }
});



// Export the Express app for Vercel
export default app;

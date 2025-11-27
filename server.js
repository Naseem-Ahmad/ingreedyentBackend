import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import keyRoutes from "./routes/keyRoutes.js"; // ✅ matches default export

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/key", keyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));

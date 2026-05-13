import "dotenv/config";
import { createApp } from "./app";

const PORT = Number(process.env.PORT) || 4000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`JewelFlow API listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${process.env.FRONTEND_URL ?? "http://localhost:3000"}`);
});

import app from "./app";
import { connectDB } from "./config/db";

const PORT = Number(process.env.PORT) || 5000;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
  });
});

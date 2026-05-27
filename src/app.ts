import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import productRoutes from "./routes/product.routes";
import categoriesRoutes from "./routes/category.routes";
import userRoutes from "./routes/user.routes";
import bannersRoutes from "./routes/baneer.routes";
import videoRoutes from "./routes/video.routes";
import reviewRoutes from "./routes/review.routes";
import gifRoutes from "./routes/gif.routes";
import searchProducts from "./routes/search.routes";
import path from "path";
import mime from "mime";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/user", userRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoriesRoutes);
app.use("/banners", bannersRoutes);
app.use("/videos", videoRoutes);
app.use("/reviews", reviewRoutes);
app.use("/gifs", gifRoutes);
app.use("/search", searchProducts);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
      const contentType = mime.getType(filePath);
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
    },
  })
);
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

export default app;

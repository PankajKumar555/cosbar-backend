import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// ─── SAFETY: Only runs with --run flag ─────────────────────────────────────
// Usage: npx ts-node seed.ts --run
// Without --run flag, nothing happens (prevents accidental data wipe)
if (!process.argv.includes("--run")) {
  console.log("⚠️  Seed not executed. Use: npx ts-node seed.ts --run");
  console.log("   This flag prevents accidental database wipes.");
  process.exit(0);
}

dotenv.config();

// ─── Models (inline to keep seed self-contained) ───────────────────────────

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  categoryId: { type: Number, required: true, unique: true },
  image: { type: String, required: true },
});

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  subHeading: { type: String, required: true },
  productId: { type: Number, required: true },
  price: { type: Number },
  productType: { type: String },
  category: { type: String, required: true },
  categoryId: { type: Number, required: true },
  view: { type: Number, required: true },
  rating: { type: Number, required: true },
  verifiedRating: { type: Number },
  keyPoints: { type: [String], required: true },
  benefits: { type: [String], required: true },
  weights: { type: [Number], required: true },
  productHighlights: { type: [String], required: true },
  images: { type: [String], required: true },
});

const bannerSchema = new mongoose.Schema({
  category: { type: String, required: true },
  categoryId: { type: Number, required: true },
  productName: { type: String, required: true },
  productId: { type: Number, required: true },
  bannerName: { type: String, required: true },
  bannerId: { type: Number, required: true, unique: true },
  image: { type: String, required: true },
});

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  heading: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, default: "" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  recommended: { type: Boolean, default: true },
});

const videoSchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  categoryId: { type: Number, required: true },
  productName: { type: String, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  videoName: { type: String, required: true },
  videoId: { type: Number, required: true, unique: true },
  views: { type: Number, required: true },
  video: { type: String, required: true },
});

const gifSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryName: { type: String, required: true },
  categoryId: { type: Number, required: true },
  productName: { type: String, required: true },
  productId: { type: Number, required: true },
  image: { type: String, default: "" },
});

const User = mongoose.model("User", userSchema);
const Category = mongoose.model("Category", categorySchema);
const Product = mongoose.model("Product", productSchema);
const Banner = mongoose.model("Banner", bannerSchema);
const Review = mongoose.model("Review", reviewSchema);
const Video = mongoose.model("Video", videoSchema);
const Gif = mongoose.model("Gif", gifSchema);

// ─── Seed Data (Dot & Key Skincare Style) ──────────────────────────────────
// Using Unsplash & Pexels free direct image URLs for cosmetic/skincare products

const categories = [
  {
    categoryName: "Moisturizers",
    categoryId: 1,
    image:
      "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    categoryName: "Sunscreens",
    categoryId: 2,
    image:
      "https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    categoryName: "Serums",
    categoryId: 3,
    image:
      "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    categoryName: "Cleansers",
    categoryId: 4,
    image:
      "https://images.pexels.com/photos/3737586/pexels-photo-3737586.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    categoryName: "Lip Care",
    categoryId: 5,
    image:
      "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    categoryName: "Body Care",
    categoryId: 6,
    image:
      "https://images.pexels.com/photos/3997373/pexels-photo-3997373.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

const products = [
  {
    productName: "Cica & Niacinamide Calming Moisturizer",
    subHeading: "Lightweight gel moisturizer for sensitive skin",
    productId: 101,
    price: 545,
    productType: "Gel Moisturizer",
    category: "Moisturizers",
    categoryId: 1,
    view: 12500,
    rating: 4.5,
    verifiedRating: 4.3,
    keyPoints: ["Oil-free formula", "Soothes redness", "72hr hydration"],
    benefits: [
      "Calms irritated skin",
      "Strengthens skin barrier",
      "Non-comedogenic",
    ],
    weights: [50, 100],
    productHighlights: [
      "Dermatologist tested",
      "Fragrance free",
      "Suitable for all skin types",
    ],
    images: [
      "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=600",
    ],
  },
  {
    productName: "Vitamin C + E Super Bright Sunscreen SPF 50",
    subHeading: "No white cast, dewy finish sunscreen",
    productId: 102,
    price: 495,
    productType: "Sunscreen",
    category: "Sunscreens",
    categoryId: 2,
    view: 18900,
    rating: 4.7,
    verifiedRating: 4.6,
    keyPoints: ["SPF 50 PA+++", "No white cast", "Lightweight texture"],
    benefits: [
      "UV protection",
      "Brightens skin tone",
      "Moisturizes while protecting",
    ],
    weights: [50],
    productHighlights: [
      "Water-resistant",
      "Suitable for daily use",
      "Under-makeup friendly",
    ],
    images: [
      "https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg?auto=compress&cs=tinysrgb&w=600",
    ],
  },
  {
    productName: "Hyaluronic & Ceramide Hydrating Serum",
    subHeading: "Deep hydration booster with 5 types of hyaluronic acid",
    productId: 103,
    price: 695,
    productType: "Serum",
    category: "Serums",
    categoryId: 3,
    view: 9800,
    rating: 4.6,
    verifiedRating: 4.4,
    keyPoints: ["5 types of HA", "Ceramide complex", "Instant plumping"],
    benefits: ["Deep hydration", "Reduces fine lines", "Restores skin barrier"],
    weights: [30, 50],
    productHighlights: ["Alcohol-free", "Vegan", "Clinically proven results"],
    images: [
      "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/7797644/pexels-photo-7797644.jpeg?auto=compress&cs=tinysrgb&w=600",
    ],
  },
  {
    productName: "Salicylic & Charcoal Anti-Acne Face Wash",
    subHeading: "Deep pore cleansing for acne-prone skin",
    productId: 104,
    price: 350,
    productType: "Face Wash",
    category: "Cleansers",
    categoryId: 4,
    view: 15200,
    rating: 4.3,
    verifiedRating: 4.1,
    keyPoints: [
      "2% Salicylic acid",
      "Activated charcoal",
      "Gentle exfoliation",
    ],
    benefits: ["Unclogs pores", "Controls oil", "Prevents breakouts"],
    weights: [100, 150],
    productHighlights: ["Sulphate-free", "pH balanced", "Daily use safe"],
    images: [
      "https://images.pexels.com/photos/3737586/pexels-photo-3737586.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/5128215/pexels-photo-5128215.jpeg?auto=compress&cs=tinysrgb&w=600",
    ],
  },
  {
    productName: "Peptide & Rosehip Lip Plumping Mask",
    subHeading: "Overnight lip treatment for soft, plump lips",
    productId: 105,
    price: 299,
    productType: "Lip Mask",
    category: "Lip Care",
    categoryId: 5,
    view: 7600,
    rating: 4.4,
    verifiedRating: 4.2,
    keyPoints: ["Peptide infused", "Rosehip oil", "Overnight repair"],
    benefits: [
      "Plumps lips naturally",
      "Heals chapped lips",
      "Long-lasting moisture",
    ],
    weights: [15],
    productHighlights: ["Berry flavor", "No artificial colors", "Cruelty-free"],
    images: [
      "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/4938369/pexels-photo-4938369.jpeg?auto=compress&cs=tinysrgb&w=600",
    ],
  },
  {
    productName: "Shea Butter & Vitamin E Body Lotion",
    subHeading: "48hr moisturizing body lotion for dry skin",
    productId: 106,
    price: 425,
    productType: "Body Lotion",
    category: "Body Care",
    categoryId: 6,
    view: 6300,
    rating: 4.5,
    verifiedRating: 4.3,
    keyPoints: ["Shea butter enriched", "Vitamin E", "48hr moisture lock"],
    benefits: [
      "Deeply nourishes",
      "Softens rough patches",
      "Non-greasy finish",
    ],
    weights: [200, 400],
    productHighlights: [
      "Paraben-free",
      "Dermatologically tested",
      "Suitable for winter",
    ],
    images: [
      "https://images.pexels.com/photos/3997373/pexels-photo-3997373.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/4465829/pexels-photo-4465829.jpeg?auto=compress&cs=tinysrgb&w=600",
    ],
  },
  {
    productName: "Retinol & Bakuchiol Night Serum",
    subHeading: "Anti-aging night serum for youthful skin",
    productId: 107,
    price: 895,
    productType: "Night Serum",
    category: "Serums",
    categoryId: 3,
    view: 11200,
    rating: 4.8,
    verifiedRating: 4.7,
    keyPoints: ["0.5% Retinol", "Bakuchiol blend", "Overnight renewal"],
    benefits: ["Reduces wrinkles", "Evens skin tone", "Boosts collagen"],
    weights: [30],
    productHighlights: [
      "Encapsulated retinol",
      "Less irritation",
      "Visible results in 4 weeks",
    ],
    images: [
      "https://images.pexels.com/photos/7797644/pexels-photo-7797644.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=600",
    ],
  },
  {
    productName: "Watermelon & Aloe Cooling Sunscreen SPF 35",
    subHeading: "Refreshing gel sunscreen for everyday use",
    productId: 108,
    price: 395,
    productType: "Gel Sunscreen",
    category: "Sunscreens",
    categoryId: 2,
    view: 8400,
    rating: 4.2,
    verifiedRating: 4.0,
    keyPoints: ["SPF 35 PA++", "Cooling gel texture", "Watermelon extract"],
    benefits: ["Lightweight protection", "Hydrates skin", "No sticky feeling"],
    weights: [50],
    productHighlights: ["Reef-safe", "Alcohol-free", "Great for oily skin"],
    images: [
      "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=600",
    ],
  },
];

const banners = [
  {
    category: "Sunscreens",
    categoryId: 2,
    productName: "Vitamin C + E Super Bright Sunscreen SPF 50",
    productId: 102,
    bannerName: "Summer Sun Protection",
    bannerId: 1,
    image:
      "https://images.pexels.com/photos/3018845/pexels-photo-3018845.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    category: "Serums",
    categoryId: 3,
    productName: "Hyaluronic & Ceramide Hydrating Serum",
    productId: 103,
    bannerName: "Hydration Heroes",
    bannerId: 2,
    image:
      "https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    category: "Moisturizers",
    categoryId: 1,
    productName: "Cica & Niacinamide Calming Moisturizer",
    productId: 101,
    bannerName: "Calm Your Skin",
    bannerId: 3,
    image:
      "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    category: "Cleansers",
    categoryId: 4,
    productName: "Salicylic & Charcoal Anti-Acne Face Wash",
    productId: 104,
    bannerName: "Clear Skin Sale",
    bannerId: 4,
    image:
      "https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

const gifs = [
  {
    name: "Sunscreen Application",
    categoryName: "Sunscreens",
    categoryId: 2,
    productName: "Vitamin C + E Super Bright Sunscreen SPF 50",
    productId: 102,
    image:
      "https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
  {
    name: "Serum Dropper",
    categoryName: "Serums",
    categoryId: 3,
    productName: "Hyaluronic & Ceramide Hydrating Serum",
    productId: 103,
    image:
      "https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
  {
    name: "Face Wash Lather",
    categoryName: "Cleansers",
    categoryId: 4,
    productName: "Salicylic & Charcoal Anti-Acne Face Wash",
    productId: 104,
    image:
      "https://images.pexels.com/photos/3737586/pexels-photo-3737586.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
  {
    name: "Lip Mask Application",
    categoryName: "Lip Care",
    categoryId: 5,
    productName: "Peptide & Rosehip Lip Plumping Mask",
    productId: 105,
    image:
      "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
];

// ─── Seed Function ─────────────────────────────────────────────────────────

async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI not found in .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Banner.deleteMany({}),
      Review.deleteMany({}),
      Video.deleteMany({}),
      Gif.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing data");

    // 1. Seed Admin User
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      username: "Admin",
      email: "pankajsing555@gmail.com",
      password: hashedPassword,
    });
    console.log(
      "👤 Admin user created (email: pankajsing555@gmail.com, password: admin123)",
    );

    // 2. Seed Categories
    await Category.insertMany(categories);
    console.log(`📁 ${categories.length} categories inserted`);

    // 3. Seed Products
    const insertedProducts = await Product.insertMany(products);
    console.log(`📦 ${products.length} products inserted`);

    // 4. Seed Banners
    await Banner.insertMany(banners);
    console.log(`🖼️  ${banners.length} banners inserted`);

    // 5. Seed Reviews (linked to products via ObjectId)
    const reviews = [
      {
        name: "Priya Sharma",
        heading: "Best moisturizer ever!",
        content:
          "I have sensitive skin and this cica moisturizer has been a game changer. No breakouts, no irritation. My skin feels so calm and hydrated throughout the day.",
        image:
          "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200",
        rating: 5,
        product: insertedProducts[0]._id,
        recommended: true,
      },
      {
        name: "Ankit Verma",
        heading: "No white cast finally!",
        content:
          "Tried so many sunscreens that left a white cast. This one blends perfectly and doesn't feel heavy. Using it daily under my moisturizer.",
        image:
          "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200",
        rating: 5,
        product: insertedProducts[1]._id,
        recommended: true,
      },
      {
        name: "Sneha Patel",
        heading: "Hydration on another level",
        content:
          "My dry skin loves this serum. I apply it before my moisturizer and the difference is visible. Skin looks plump and dewy.",
        image:
          "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
        rating: 4,
        product: insertedProducts[2]._id,
        recommended: true,
      },
      {
        name: "Rahul Gupta",
        heading: "Cleared my acne in 2 weeks",
        content:
          "Was skeptical at first but this face wash actually works. My forehead acne is almost gone. Using it twice daily as recommended.",
        image:
          "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200",
        rating: 4,
        product: insertedProducts[3]._id,
        recommended: true,
      },
      {
        name: "Meera Joshi",
        heading: "Soft lips overnight",
        content:
          "I apply this before bed and wake up with the softest lips. The berry scent is lovely too. Repurchasing for sure!",
        image:
          "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=200",
        rating: 5,
        product: insertedProducts[4]._id,
        recommended: true,
      },
      {
        name: "Kavita Nair",
        heading: "Holy grail body lotion",
        content:
          "Finally a body lotion that actually lasts all day without being greasy. My elbows and knees are so much softer now.",
        image:
          "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200",
        rating: 4,
        product: insertedProducts[5]._id,
        recommended: true,
      },
      {
        name: "Deepak Singh",
        heading: "Visible results in 3 weeks",
        content:
          "Started using the retinol serum and my fine lines around eyes have reduced noticeably. No irritation either thanks to the bakuchiol.",
        image:
          "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200",
        rating: 5,
        product: insertedProducts[6]._id,
        recommended: true,
      },
      {
        name: "Aisha Khan",
        heading: "Perfect for Indian summers",
        content:
          "This watermelon sunscreen feels so refreshing. Doesn't clog pores and the cooling effect is real. Great for oily skin in humid weather.",
        image:
          "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=200",
        rating: 4,
        product: insertedProducts[7]._id,
        recommended: true,
      },
    ];
    await Review.insertMany(reviews);
    console.log(`⭐ ${reviews.length} reviews inserted`);

    // 6. Seed Videos (linked to products)
    // Using sample video URLs from Pexels (free stock videos)
    const videos = [
      {
        categoryName: "Sunscreens",
        categoryId: 2,
        productName: "Vitamin C + E Super Bright Sunscreen SPF 50",
        product: insertedProducts[1]._id,
        videoName: "How to Apply Sunscreen Correctly",
        videoId: 1,
        views: 25000,
        video:
          "https://videos.pexels.com/video-files/5765760/5765760-sd_640_360_25fps.mp4",
      },
      {
        categoryName: "Serums",
        categoryId: 3,
        productName: "Hyaluronic & Ceramide Hydrating Serum",
        product: insertedProducts[2]._id,
        videoName: "Serum Layering Guide",
        videoId: 2,
        views: 18000,
        video:
          "https://videos.pexels.com/video-files/5765834/5765834-sd_640_360_25fps.mp4",
      },
      {
        categoryName: "Cleansers",
        categoryId: 4,
        productName: "Salicylic & Charcoal Anti-Acne Face Wash",
        product: insertedProducts[3]._id,
        videoName: "Double Cleansing Method",
        videoId: 3,
        views: 32000,
        video:
          "https://videos.pexels.com/video-files/6981411/6981411-sd_640_360_25fps.mp4",
      },
      {
        categoryName: "Serums",
        categoryId: 3,
        productName: "Retinol & Bakuchiol Night Serum",
        product: insertedProducts[6]._id,
        videoName: "Retinol Beginner Guide",
        videoId: 4,
        views: 41000,
        video:
          "https://videos.pexels.com/video-files/5765760/5765760-sd_640_360_25fps.mp4",
      },
    ];
    await Video.insertMany(videos);
    console.log(`🎬 ${videos.length} videos inserted`);

    // 7. Seed Gifs
    await Gif.insertMany(gifs);
    console.log(`🎞️  ${gifs.length} gifs inserted`);

    console.log("\n🎉 Seed completed successfully!");
    console.log("─────────────────────────────────────");
    console.log("Admin Login:");
    console.log("  Email:    pankajsing555@gmail.com");
    console.log("  Password: admin123");
    console.log("─────────────────────────────────────");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();

// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import exportRoutes from "./routes/export.js";
import { db } from "./config/firebase.js";

dotenv.config();

const app = express();

// =======================
//  CORS FIX
// =======================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://lexquise-contest.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// =======================
// Cloudinary
// =======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================
// Multer
// =======================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// =======================
// ROOT ROUTE — IMPORTANT
// =======================
app.get("/", (req, res) => {
  res.json({
    status: "Backend Running",
    message: "Welcome to Lexquise Contest API",
  });
});

// =======================
// Save Entry
// =======================
// =======================
// Save Entry with captchaToken
// =======================
app.post("/saveEntry", upload.single("file"), async (req, res) => {
  try {
    const { firstName, lastName, phone, city, code, deviceId, captchaToken } = req.body;

    // ====== تحقق من captchaToken ======
    if (!captchaToken) {
      return res.status(400).json({ error: "رجاءً أكّد أنك لست روبوتًا." });
    }

    // إذا أردت تحقق رسمي من Google ReCAPTCHA:
    /*
    const axios = require("axios");
    const secretKey = process.env.RECAPTCHA_SECRET;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

    const response = await axios.post(verifyUrl);
    if (!response.data.success) {
      return res.status(400).json({ error: "فشل التحقق من reCAPTCHA." });
    }
    */

    if (!deviceId) {
      return res.status(400).json({ error: "معرّف الجهاز مفقود" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "يرجى رفع صورة القارورة" });
    }

    const phoneSnapshot = await db
      .collection("entries")
      .where("phone", "==", phone)
      .get();
    if (!phoneSnapshot.empty) {
      return res.status(400).json({ error: "رقم الهاتف سبق استخدامه." });
    }

    const deviceSnapshot = await db
      .collection("entries")
      .where("deviceId", "==", deviceId)
      .get();
    if (!deviceSnapshot.empty) {
      return res.status(400).json({ error: "هذا الجهاز شارك مسبقاً." });
    }

    const buffer = req.file.buffer;
    const hash = crypto.createHash("md5").update(buffer).digest("hex");

    const hashSnapshot = await db
      .collection("entries")
      .where("imageHash", "==", hash)
      .get();
    if (!hashSnapshot.empty) {
      return res.status(400).json({ error: "الصورة تم استخدامها مسبقاً." });
    }

    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "lexquise-contest" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const uploadResult = await uploadToCloudinary(buffer);
    const imageUrl = uploadResult.secure_url;

    const docRef = db.collection("entries").doc();
    await docRef.set({
      firstName,
      lastName,
      phone,
      city,
      code,
      imageUrl,
      imageHash: hash,
      deviceId,
      //captchaToken, // حفظ الـ token (اختياري)
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, id: docRef.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ المشاركة" });
  }
});

// =======================
// Get Entries
// =======================
app.get("/getEntries", async (req, res) => {
  try {
    const snapshot = await db.collection("entries").get();
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ success: true, entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching entries" });
  }
});


app.use("/export", exportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

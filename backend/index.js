// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
import exportRoutes from "./routes/export.js";
import { db } from "./config/firebase.js"; // لا تعيد initializeApp هنا

dotenv.config();

const app = express();

app.use(cors({
    origin: [
        "https://lexquise-contest.vercel.app", // موقعك على Vercel
        "http://localhost:5173"                // أثناء التطوير
    ],
    methods: "GET,POST,PUT,DELETE",
    credentials: true
}));

app.use(express.json());

// === Cloudinary Initialization ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// === Multer Setup ===
const storage = multer.memoryStorage();
const upload = multer({ storage });

// =========================================================
// 🟠 1) Save Entry مع التحقق من الهاتف + Hash الصورة + FingerprintJS
// =========================================================
app.post("/saveEntry", upload.single("file"), async (req, res) => {
  try {
    const { firstName, lastName, phone, city, code, deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: "معرّف الجهاز مفقود (Device Fingerprint)" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "يرجى رفع صورة القارورة" });
    }

    // --- تحقق من رقم الهاتف ---
    const phoneSnapshot = await db
      .collection("entries")
      .where("phone", "==", phone)
      .get();
    if (!phoneSnapshot.empty) {
      return res.status(400).json({ error: "رقم الهاتف سبق استخدامه." });
    }

    // --- تحقق من Device FingerprintJS ---
    const deviceSnapshot = await db
      .collection("entries")
      .where("deviceId", "==", deviceId)
      .get();
    if (!deviceSnapshot.empty) {
      return res.status(400).json({
        error: "هذا الجهاز شارك مسبقاً، لا يمكنك المشاركة مرتين.",
      });
    }

    // --- حساب Hash الصورة ---
    const buffer = req.file.buffer;
    const hash = crypto.createHash("md5").update(buffer).digest("hex");

    const hashSnapshot = await db
      .collection("entries")
      .where("imageHash", "==", hash)
      .get();
    if (!hashSnapshot.empty) {
      return res.status(400).json({
        error: "هذه الصورة تم استخدامها مسبقاً.",
      });
    }

    // --- رفع الصورة إلى Cloudinary ---
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

    // --- حفظ البيانات ---
    const docRef = db.collection("entries").doc();
    await docRef.set({
      firstName,
      lastName,
      phone,
      city,
      code,
      imageUrl,
      imageHash: hash,
      deviceId, // 🟢 تخزين معرّف الجهاز
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, id: docRef.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ المشاركة" });
  }
});

// =========================================================
// 🟠 2) Get All Entries
// =========================================================
app.get("/getEntries", async (req, res) => {
  try {
    const snapshot = await db
      .collection("entries")
      .orderBy("createdAt", "desc")
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في جلب البيانات" });
  }
});

// =========================================================
// Start server
// =========================================================

app.use("/export", exportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from "express";
import JSZip from "jszip";
import { Parser } from "json2csv";
import axios from "axios";
import { db } from "../config/firebase.js"; // استدعاء Firebase من ملف الإعدادات

const router = express.Router();

// GET /export
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("entries").orderBy("createdAt", "desc").get();
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (entries.length === 0) return res.status(404).json({ error: "لا توجد بيانات للتصدير" });

    const zip = new JSZip();

    // CSV
    const fields = ["firstName", "lastName", "phone", "city", "code", "deviceId", "createdAt"];
    const parser = new Parser({ fields });
	let csv = parser.parse(entries);
	// إضافة BOM لجعل Excel يتعرف على العربية
	csv = "\uFEFF" + csv;
	zip.file("entries.csv", csv);
    // الصور
    const imgFolder = zip.folder("images");

    await Promise.all(entries.map(async (entry, index) => {
      try {
        const response = await axios.get(entry.imageUrl, { responseType: "arraybuffer" });
        const ext = entry.imageUrl.split(".").pop().split("?")[0];
        imgFolder.file(`image_${index + 1}.${ext}`, response.data);
      } catch (err) {
        console.error(`فشل تحميل الصورة ${entry.imageUrl}`, err);
      }
    }));

    // توليد ZIP
    const content = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=entries_with_images.zip"
    });
    res.send(content);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حدث خطأ أثناء التصدير" });
  }
});

export default router;

import { useState, useEffect } from "react";
import axios from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useNavigate } from "react-router-dom";

export default function UploadForm({ competitionCode }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    file: null,
  });

  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFP = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setDeviceId(result.visitorId);
      } catch (err) {
        console.error("FingerprintJS failed", err);
      }
    };
    loadFP();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setFormData({ ...formData, file: files[0] });
    else setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setError("يرجى رفع صورة القارورة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dataForm = new FormData();
      dataForm.append("firstName", formData.firstName);
      dataForm.append("lastName", formData.lastName);
      dataForm.append("phone", formData.phone);
      dataForm.append("city", formData.city);
      dataForm.append("code", competitionCode);
      dataForm.append("file", formData.file);
      dataForm.append("deviceId", deviceId);

      await axios.post("http://192.168.1.15:5000/saveEntry", dataForm, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/success");

    } catch (err) {
      const serverMessage = err.response?.data?.error;
      setError(serverMessage || "حدث خطأ أثناء إرسال البيانات.");
    }

    setLoading(false);
  };

  return (
    <div className="relative max-w-xl mx-auto mt-10 p-8 bg-white shadow-2xl rounded-2xl border border-orange-300 overflow-hidden" dir="rtl">
      {/* ==== صور الهدايا المتحركة ==== */}
      <img src="/images/gift1.png" className="absolute w-14 top-5 left-10 animate-bounce-slow" />
      <img src="/images/gift2.png" className="absolute w-16 top-10 right-5 animate-bounce-fast" />
      <img src="/images/gift3.png" className="absolute w-14 bottom-0 left-5 animate-bounce-medium" />

      <h2 className="text-3xl font-extrabold mb-6 text-center text-orange-600 animate-bounce">
         شارك في مسابقة L'exquise 
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-pulse">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {["firstName", "lastName", "phone", "city"].map((field, idx) => (
          <input
            key={idx}
            type="text"
            name={field}
            placeholder={
              field === "firstName"
                ? "الاسم الأول"
                : field === "lastName"
                ? "اللقب"
                : field === "phone"
                ? "رقم الهاتف"
                : "العنوان"
            }
            value={formData[field]}
            onChange={handleChange}
            required
            className="w-full p-4 border border-gray-300 rounded-xl text-right placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition duration-300"
          />
        ))}

        <input
          type="text"
          placeholder={`المسابقة: ${competitionCode}`}
          value={`المسابقة: ${competitionCode}`}
          disabled
          className="w-full p-4 border border-gray-200 rounded-xl bg-gray-100 text-right font-semibold text-gray-600"
        />

        <input
          type="file"
          name="file"
          accept="image/*"
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition duration-300"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-2xl shadow-lg hover:scale-105 transform transition-all duration-300 hover:shadow-xl"
        >
          {loading ? "⏳ جاري الإرسال..." : "إرسال المشاركة"}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-4">
        بصمة جهازك: {deviceId || "جاري التحميل..."}
      </p>
    </div>
  );
}

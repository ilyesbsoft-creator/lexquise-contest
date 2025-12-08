import { useState, useEffect } from "react";
import axios from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

export default function UploadForm({ competitionCode }) {
  const navigate = useNavigate();
  const RECAPTCHA_KEY = "6LftHCUsAAAAAEYLfexCbQg4WRXFuDEla1SXACD2";

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
  const [captchaToken, setCaptchaToken] = useState("");

  // Modal (الشروط)
  const [showModal, setShowModal] = useState(false);

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

    if (!captchaToken) {
      setError("رجاءً أكّد أنك لست روبوتًا.");
      return;
    }

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
      dataForm.append("captchaToken", captchaToken);

      await axios.post(
        "https://lexquise-contest.onrender.com/saveEntry",
        dataForm,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      navigate("/success");
    } catch (err) {
      const serverMessage = err.response?.data?.error;
      setError(serverMessage || "حدث خطأ أثناء إرسال البيانات.");
    }

    setLoading(false);
  };

  return (
    <div className="relative w-full px-4 py-10 flex justify-center">
      <div className="relative w-full max-w-sm md:max-w-lg lg:max-w-xl bg-white shadow-2xl rounded-2xl p-6 md:p-8 border border-orange-300 overflow-hidden"
        dir="rtl">

        {/* ==== صور الهدايا ==== */}
        <img src="/images/gift1.png" className="absolute w-10 md:w-14 top-5 left-5 animate-bounce-slow" />
        <img src="/images/gift2.png" className="absolute w-12 md:w-16 top-10 right-5 animate-bounce-fast" />
        <img src="/images/gift3.png" className="absolute w-10 md:w-14 bottom-2 left-5 animate-bounce-medium" />

        <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-center text-orange-600 animate-bounce">
          شارك في مسابقة L'exquise
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-pulse text-sm text-center">
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
              className="w-full p-4 border border-gray-300 rounded-xl text-right placeholder-gray-400 
              focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
          ))}

          <input
            type="text"
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
            className="w-full p-3 border border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition"
          />

          {/* reCAPTCHA */}
          <div className="flex justify-center">
            <ReCAPTCHA sitekey={RECAPTCHA_KEY} onChange={setCaptchaToken} />
          </div>

          {/* زر الشروط */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full py-3 text-orange-600 font-bold border border-orange-400 rounded-xl hover:bg-orange-50 transition"
          >
            عرض شروط المسابقة
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition"
          >
            {loading ? "⏳ جاري الإرسال..." : "إرسال المشاركة"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          بصمة جهازك: {deviceId || "جاري التحميل..."}
        </p>
      </div>

      {/* ==== نافذة الشروط (Modal) ==== */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl" dir="rtl">
            <h3 className="text-xl font-bold mb-3 text-orange-600 text-center">شروط المسابقة</h3>

			<ul className="text-sm leading-7 text-gray-700">
				<li>• المشاركة مخصّصة لسكان ولاية المدية فقط.</li>
				<li>• يجب أن تكون الصورة لقارورة L’Exquise بسعة 1 لتر أو 2 لتر داخل المنزل.</li>
				<li>• يُمنع استخدام صور قديمة أو من الإنترنت أو من مشاركين آخرين.</li>
				<li>• إرسال أكثر من مشاركة في الدورة الواحدة يؤدي إلى الإقصاء.</li>
				<li>• أي محاولة غش تُؤدي إلى الإقصاء النهائي.</li>
				<li>• المشاركة تعني الموافقة على جميع الشروط وقرارات اللجنة المنظمة.</li>
				<li>• يتم استخدام بصمة المتصفح لأغراض منع التلاعب وضمان نزاهة المشاركة.</li>
			</ul>


            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

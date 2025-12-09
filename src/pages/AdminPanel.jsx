import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import WinnerModal from "../components/WinnerModal";

export default function AdminPanel() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false); // عند السحب (spinner)
  const [winners, setWinners] = useState([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [winnerCount, setWinnerCount] = useState(1);
  const [preview, setPreview] = useState(null); // لإظهار أسماء متغيرة أثناء "القرعة"
  const shuffleIntervalRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    if (!admin) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://lexquise-contest.onrender.com/getEntries");
      // دعم صيغ عديدة في الـ response
      const data = res.data?.entries ?? res.data ?? [];
      if (Array.isArray(data)) setEntries(data);
      else setEntries([]);
    } catch (err) {
      console.error("fetchEntries error:", err);
      alert("خطأ في جلب البيانات");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Fisher-Yates shuffle — عشوائية قوية
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // WebAudio - مؤثر صوتي احتفالي بسيط (بلا ملفات)
  const playWinSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      // نغمات قصيرة متتابعة
      const freqs = [880, 990, 1320, 1760]; // A6-like ascending
      let t = 0;
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, now + t);
        g.gain.setValueAtTime(0, now + t);
        g.gain.linearRampToValueAtTime(0.12, now + t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.18);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + t);
        o.stop(now + t + 0.2);
        t += 0.12;
      });
    } catch (e) {
      console.warn("Audio not available:", e);
    }
  };

  // عملية السحب: عرض "معاينة متحركة" ثم اختيار الفائزين نهائياً
  const drawWinners = () => {
    if (!entries || entries.length === 0) return alert("لا توجد مشاركات");

    const count = Math.min(winnerCount || 1, entries.length);
    setDrawing(true);
    setWinners([]);
    setPreview(null);

    // نبدأ "تشغيل" معاينة تتغير بسرعة -> يشعر المستخدم أن الحظوظ تدور
    let localCounter = 0;
    shuffleIntervalRef.current = setInterval(() => {
      // نختار اسم عشوائي للعرض المؤقت
      const candidate = entries[Math.floor(Math.random() * entries.length)];
      setPreview(candidate);
      localCounter++;
      // نبطئ تدريجياً كلما اقتربنا من النهاية لإحساس مثير
      if (localCounter > 12) {
        // نزيد احتمالية التباطؤ: بعد 12 خطوة نبدّل الـ interval
        clearInterval(shuffleIntervalRef.current);
        // سلسلة توقيت متصاعدة حتى النهاية
        const delays = [120, 200, 320, 480, 700];
        let idx = 0;
        const slowLoop = () => {
          setTimeout(() => {
            const cand = entries[Math.floor(Math.random() * entries.length)];
            setPreview(cand);
            idx++;
            if (idx < delays.length) slowLoop();
            else finalizeWinners(); // بعد الانتهاء -> نعلن الفائزين الحقيقية
          }, delays[idx]);
        };
        slowLoop();
      }
    }, 80); // تغيير سريع في البداية ليشعر المستخدم بالحركة

    const finalizeWinners = () => {
      // اختيار نهائي بالعشوائية القوية
      const shuffled = shuffleArray(entries);
      const selected = shuffled.slice(0, count);
      setTimeout(() => {
        setWinners(selected);
        setCurrentWinnerIndex(0);
        setDrawing(false);
        setPreview(null);
      }, 350); // وقت قصير قبل إظهار النتائج
    };
  };

  useEffect(() => {
    // تنظيف إن كان المكوّن يترك أثناء الشغل
    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    };
  }, []);

  const handleCloseWinner = () => {
    if (currentWinnerIndex < winners.length - 1) {
      setCurrentWinnerIndex((s) => s + 1);
    } else {
      setWinners([]);
      setCurrentWinnerIndex(0);
    }
  };

  return (
    <div className="p-6 text-center max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم - المشاركين</h1>

      <div className="text-6xl font-extrabold text-orange-500 mb-2">
        {Array.isArray(entries) ? entries.length : 0}
      </div>
      <p className="mb-6 text-gray-600 text-lg">عدد المشاركين الحاليين</p>

      <div className="flex flex-col md:flex-row justify-center gap-4 mb-6 items-center">
        <button
          onClick={fetchEntries}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          disabled={loading || drawing}
        >
          🔄 تحديث
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={entries.length || 1}
            value={winnerCount}
            onChange={(e) => setWinnerCount(Number(e.target.value || 1))}
            className="w-20 p-2 border rounded text-center"
            disabled={drawing}
          />
          <button
            onClick={drawWinners}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
            disabled={drawing || loading || entries.length === 0}
          >
            {drawing ? "⏳ جاري السحب..." : "🎉 سحب الفائزين"}
          </button>
        </div>
      </div>

      {/* معاينة اسم متحرك أثناء السحب */}
      {drawing && preview && (
        <div className="mb-6">
          <div className="inline-block p-6 bg-white shadow-lg rounded-lg transform transition-all animate-pulse">
            <div className="text-sm text-gray-500">قيد الاختيار...</div>
            <div className="text-2xl font-bold mt-2">
              {preview.firstName ? `${preview.firstName} ${preview.lastName || ""}` : preview.phone || "مشارك مجهول"}
            </div>
          </div>
        </div>
      )}

      {/* Spinner بصري أثناء السحب إذا أردت أكثر إبراز */}
      {drawing && (
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* مودال الفائز الحالي */}
      {winners.length > 0 && (
        <WinnerModal
          winner={winners[currentWinnerIndex]}
          title={`الفائز ${currentWinnerIndex + 1} من ${winners.length}`}
          buttonText={currentWinnerIndex < winners.length - 1 ? "التالي" : "إغلاق"}
          onClose={() => {
            // مؤثر صوتي + انطلاق confetti داخل الـ WinnerModal نفسه
            handleCloseWinner();
          }}
          onShow={() => {
            // عند إظهار كل فائز: نلعب صوت هنا (بإمكاننا أيضاً تشغيل داخلياً في WinnerModal)
            playWinSound();
          }}
        />
      )}
    </div>
  );
}

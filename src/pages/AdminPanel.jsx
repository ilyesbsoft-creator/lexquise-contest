import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import WinnerModal from "../components/WinnerModal";

export default function AdminPanel() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [winners, setWinners] = useState([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [winnerCount, setWinnerCount] = useState(1);
  const [preview, setPreview] = useState(null);
  const shuffleIntervalRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    if (!admin) navigate("/admin/login");
  }, [navigate]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://lexquise-contest.onrender.com/getEntries");
      const data = res.data?.entries ?? res.data ?? [];
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("خطأ في جلب البيانات");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Fisher-Yates shuffle
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // إزالة التكرار حسب group
  const uniqueByGroup = (list) => {
    const map = new Map();
    list.forEach((item) => {
      if (!map.has(item.group)) {
        map.set(item.group, item);
      }
    });
    return Array.from(map.values());
  };

  const playWinSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const freqs = [880, 990, 1320, 1760];
      let t = 0;
      freqs.forEach((f) => {
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
    } catch {}
  };

  const drawWinners = () => {
    if (!entries.length) return alert("لا توجد مشاركات");

    const totalWinners = Math.min(winnerCount, entries.length);
    const strangersCount = Math.floor(totalWinners / 2);
    const remainingCount = totalWinners - strangersCount;

    setDrawing(true);
    setWinners([]);
    setPreview(null);

    // عرض سريع أثناء السحب
    shuffleIntervalRef.current = setInterval(() => {
      setPreview(entries[Math.floor(Math.random() * entries.length)]);
    }, 80);

    const finalizeWinners = () => {
      clearInterval(shuffleIntervalRef.current);

      // 1️⃣ اختيار الغرباء أولًا
      const allStrangers = uniqueByGroup(
        shuffleArray(entries.filter(e => e.isRelative === false))
      );
      const strangers = allStrangers.slice(0, strangersCount);

      // تعيين المجموعات المستخدمة
      const usedGroups = new Set(strangers.map(w => w.group));

      // 2️⃣ الباقي من الأقارب + الغرباء المتبقين مع استبعاد مجموعات الغرباء المختارة
      const remainingCandidates = entries.filter(
        e => !usedGroups.has(e.group)
      );

      const remainingPool = uniqueByGroup(shuffleArray(remainingCandidates)).slice(0, remainingCount);

      const finalWinners = [...strangers, ...remainingPool];

      setTimeout(() => {
        setWinners(finalWinners);
        setCurrentWinnerIndex(0);
        setDrawing(false);
        setPreview(null);
      }, 350);
    };

    setTimeout(finalizeWinners, 2000);
  };

  useEffect(() => {
    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    };
  }, []);

  const handleCloseWinner = () => {
    if (currentWinnerIndex < winners.length - 1) {
      setCurrentWinnerIndex((i) => i + 1);
    } else {
      setWinners([]);
      setCurrentWinnerIndex(0);
    }
  };

  return (
    <div className="p-6 text-center max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم - المشاركين</h1>

      <div className="text-6xl font-extrabold text-orange-500 mb-2">
        {entries.length}
      </div>
      <p className="mb-6 text-gray-600 text-lg">عدد المشاركين الحاليين</p>

      <div className="flex flex-col md:flex-row justify-center gap-4 mb-6 items-center">
        <button
          onClick={fetchEntries}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg"
          disabled={loading || drawing}
        >
          🔄 تحديث
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={entries.length}
            value={winnerCount}
            onChange={(e) => setWinnerCount(Number(e.target.value || 1))}
            className="w-20 p-2 border rounded text-center"
            disabled={drawing}
          />
          <button
            onClick={drawWinners}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
            disabled={drawing || loading}
          >
            🎉 سحب الفائزين
          </button>
        </div>
      </div>

      {drawing && preview && (
        <div className="mb-6">
          <div className="inline-block p-6 bg-white shadow-lg rounded-lg animate-pulse">
            <div className="text-sm text-gray-500">قيد الاختيار...</div>
            <div className="text-2xl font-bold mt-2">
              {preview.firstName
                ? `${preview.firstName} ${preview.lastName || ""}`
                : preview.phone}
            </div>
          </div>
        </div>
      )}

      {drawing && (
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      )}

      {winners.length > 0 && (
        <WinnerModal
          winner={winners[currentWinnerIndex]}
          title={`الفائز ${currentWinnerIndex + 1} من ${winners.length}`}
          buttonText={currentWinnerIndex < winners.length - 1 ? "التالي" : "إغلاق"}
          onClose={handleCloseWinner}
          onShow={playWinSound}
        />
      )}
    </div>
  );
}

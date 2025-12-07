import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";
import WinnerModal from "../components/WinnerModal";

export default function AdminPanel() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winners, setWinners] = useState([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0); // الفائز الحالي
  const [winnerCount, setWinnerCount] = useState(1); // عدد الفائزين الذي يحدده الأدمن

  const navigate = useNavigate();

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    if (!admin) {
      navigate("/admin/login");
    }
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://lexquise-contest.onrender.com/getEntries");
      setEntries(res.data.entries);
    } catch (err) {
      console.error(err);
      alert("خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const drawWinners = () => {
    if (entries.length === 0) return alert("لا توجد مشاركات");

    const count = Math.min(winnerCount, entries.length);
    const shuffled = [...entries].sort(() => 0.5 - Math.random());
    setWinners(shuffled.slice(0, count));
    setCurrentWinnerIndex(0);
  };

  const handleCloseWinner = () => {
    if (currentWinnerIndex < winners.length - 1) {
      setCurrentWinnerIndex(currentWinnerIndex + 1);
    } else {
      setWinners([]);
      setCurrentWinnerIndex(0);
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم - المشاركين</h1>

      <div className="text-6xl font-extrabold text-orange-500 mb-6">
        {entries.length}
      </div>
      <p className="mb-6 text-gray-600 text-lg">عدد المشاركين الحاليين</p>

      <div className="flex flex-col md:flex-row justify-center gap-4 mb-6 items-center">
        <button
          onClick={fetchEntries}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          🔄 تحديث
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={entries.length}
            value={winnerCount}
            onChange={(e) => setWinnerCount(Number(e.target.value))}
            className="w-20 p-2 border rounded text-center"
          />
          <button
            onClick={drawWinners}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            🎉 سحب الفائزين
          </button>
        </div>
      </div>

      {/* عرض مودال الفائز الحالي فقط */}
      {winners.length > 0 && (
        <WinnerModal
          winner={winners[currentWinnerIndex]}
          title={`الفائز ${currentWinnerIndex + 1}`}
          buttonText={
            currentWinnerIndex < winners.length - 1 ? "التالي" : "إغلاق"
          }
          onClose={handleCloseWinner}
        />
      )}
    </div>
  );
}

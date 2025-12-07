import React from "react";

export default function ExportPanel() {
  const downloadExport = () => {
    window.location.href = "https://lexquise-contest.onrender.com/export"; // رابط API التصدير
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">تصدير المشاركات مع الصور</h1>
      <button
        onClick={downloadExport}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        ⬇️ تحميل CSV + الصور
      </button>
    </div>
  );
}

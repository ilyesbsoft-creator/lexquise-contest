import React from "react";

export default function WinnerModal({ winner, onClose, title, buttonText }) {
  if (!winner) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
        {/* العنوان ديناميكي */}
        <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>

        <img
          src={winner.imageUrl}
          alt="Winner Image"
          className="w-full h-52 object-cover rounded-xl mb-4"
        />

        <div className="text-lg text-right">
          <p><strong>الاسم:</strong> {winner.firstName} {winner.lastName}</p>
          <p><strong>الهاتف:</strong> {winner.phone}</p>
          <p><strong>المدينة:</strong> {winner.city}</p>
          <p><strong>الكود:</strong> {winner.code}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

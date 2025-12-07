import React from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      // قائمة الايميلات المسموح لها بالدخول كأدمن
      const allowedAdmins = ["ilyes.bsoft@gmail.com","lexquise.medea@gmail.com"];

      if (!allowedAdmins.includes(email)) {
        alert("ليس لديك صلاحية الدخول كأدمن");
        return;
      }

      // حفظ الجلسة
      localStorage.setItem("admin", email);

      navigate("/admin");
    } catch (error) {
      console.error(error);
      alert("فشل تسجيل الدخول");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">دخول الأدمن</h1>
        <button
          onClick={login}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          تسجيل الدخول باستخدام Google
        </button>
      </div>
    </div>
  );
}

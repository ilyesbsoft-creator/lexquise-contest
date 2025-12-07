import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import ExportPanel from "./pages/ExportPanel"; // ✅ استيراد الصفحة الجديدة
import Success from "./pages/Success"; // ✅ تأكد أن المسار صحيح


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
		 <Route path="/success" element={<Success />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/export" element={<ExportPanel />} /> {/* ✅ إضافة المسار الجديد */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

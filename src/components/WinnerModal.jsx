import React, { useEffect, useRef } from "react";

/**
 * WinnerModal props:
 * - winner: object (المشاركة)
 * - title: string
 * - buttonText: string
 * - onClose: function
 * - onShow: optional function (when modal opens)
 *
 * هذا المودال يتضمن:
 * - أنيميشن دخول/خروج
 * - canvas لصنع confetti عند mount
 * - تشغيل onShow (مثل صوت) عند الظهور
 */

export default function WinnerModal({ winner, title, buttonText, onClose, onShow }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (onShow) onShow();
    startConfetti();
    // تتوقف بعد 5 ثواني
    const t = setTimeout(() => stopConfetti(), 5000);
    return () => {
      clearTimeout(t);
      stopConfetti();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  // ======== Confetti بسيط على canvas ========
  const confettiState = useRef({
    ctx: null,
    particles: [],
    raf: null,
  });

  const startConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    confettiState.current.ctx = ctx;
    resizeCanvas();
    spawnParticles(120);
    loop();
    window.addEventListener("resize", resizeCanvas);
  };

  const stopConfetti = () => {
    window.removeEventListener("resize", resizeCanvas);
    if (confettiState.current.raf) {
      cancelAnimationFrame(confettiState.current.raf);
      confettiState.current.raf = null;
    }
    confettiState.current.particles = [];
    const ctx = confettiState.current.ctx;
    if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  };

  const random = (min, max) => Math.random() * (max - min) + min;

  const spawnParticles = (n = 80) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width } = canvas;
    const colors = ["#ff4444", "#ffbb33", "#00C851", "#33b5e5", "#ff66cc", "#aa66cc"];

    for (let i = 0; i < n; i++) {
      confettiState.current.particles.push({
        x: random(0, width),
        y: random(-50, -10),
        w: random(6, 12),
        h: random(8, 14),
        vx: random(-2, 2),
        vy: random(2, 6),
        rot: random(0, Math.PI * 2),
        vr: random(-0.15, 0.15),
        color: colors[Math.floor(Math.random() * colors.length)],
        ttl: random(3000, 6000),
        created: Date.now(),
      });
    }
  };

  const updateParticles = (dt) => {
    const p = confettiState.current.particles;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gravity = 0.12;
    for (let i = p.length - 1; i >= 0; i--) {
      const par = p[i];
      par.vy += gravity;
      par.x += par.vx;
      par.y += par.vy;
      par.rot += par.vr;
      // remove after ttl or out of canvas
      if (Date.now() - par.created > par.ttl || par.y - par.h > canvas.height + 60) {
        p.splice(i, 1);
      }
    }
  };

  const drawParticles = () => {
    const ctx = confettiState.current.ctx;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiState.current.particles.forEach((par) => {
      ctx.save();
      ctx.translate(par.x, par.y);
      ctx.rotate(par.rot);
      ctx.fillStyle = par.color;
      // رسم مستطيل مائل كمقطع confetti
      ctx.fillRect(-par.w / 2, -par.h / 2, par.w, par.h);
      ctx.restore();
    });
  };

  const loop = () => {
    updateParticles();
    drawParticles();
    if (confettiState.current.particles.length < 40) spawnParticles(18);
    confettiState.current.raf = requestAnimationFrame(loop);
  };
  // ======== نهاية confetti ========

  const displayName = (w) => {
    if (!w) return "مشارك";
    if (w.firstName) return `${w.firstName} ${w.lastName || ""}`;
    if (w.phone) return w.phone;
    if (w.email) return w.email;
    return w.id || "مشارك";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* خلفية مظلمة */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* صندوق المودال */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 transform transition-all
                      animate-fade-in-up">
        {/* canvas فوق المودال */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl"></canvas>

        <div className="relative z-10">
          <h2 className="text-xl font-semibold mb-2">{title}</h2>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center text-4xl font-extrabold text-orange-600 shadow-inner">
              🎖️
            </div>

            <div className="text-left">
              <div className="text-2xl font-bold">{displayName(winner)}</div>
              {winner && winner.city && <div className="text-sm text-gray-500 mt-1">من: {winner.city}</div>}
              {winner && winner.phone && <div className="text-sm text-gray-500 mt-1">هاتف: {winner.phone}</div>}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>

      {/* أنيميشن بسيطة */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 360ms cubic-bezier(.2,.9,.3,1);
        }
      `}</style>
    </div>
  );
}

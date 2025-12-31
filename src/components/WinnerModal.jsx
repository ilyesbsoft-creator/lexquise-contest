import React, { useEffect, useRef } from "react";

/**
 * Props:
 * - winner: object (المشارك)
 * - title: string
 * - buttonText: string
 * - onClose: function
 * - onShow: optional function عند ظهور الفائز
 */

export default function WinnerModal({ winner, title, buttonText, onClose, onShow }) {
  const canvasRef = useRef(null);

  // ======== تشغيل الصوت + confetti + rotation ========
  useEffect(() => {
    if (!winner) return;
    if (onShow) onShow();
    playWinSound();
    startConfetti();

    const t = setTimeout(stopConfetti, 5000);
    return () => {
      clearTimeout(t);
      stopConfetti();
    };
  }, [winner]);

  // ======== Confetti ========
  const confettiState = useRef({
    ctx: null,
    particles: [],
    raf: null,
  });

  const startConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    confettiState.current.ctx = canvas.getContext("2d");
    resizeCanvas();
    spawnParticles(120);
    loop();
    window.addEventListener("resize", resizeCanvas);
  };

  const stopConfetti = () => {
    window.removeEventListener("resize", resizeCanvas);
    if (confettiState.current.raf) cancelAnimationFrame(confettiState.current.raf);
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

  const updateParticles = () => {
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

  // ======== صوت الفائز ========
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
    } catch (e) {
      console.warn("Audio not supported:", e);
    }
  };

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 transform transition-all animate-fade-in-up">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl"></canvas>

        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>

          {/* صورة المنتج مع أنيميشن rotation + bounce */}
          <img
            src={winner.imageUrl || "/placeholder.png"}
            alt="Winner Product"
            className="w-48 h-48 object-cover rounded-full border-4 border-orange-400 shadow-lg mb-4 animate-bounce-rotate"
          />

          <div className="text-right w-full space-y-1">
            <p><strong>الاسم:</strong> {winner.firstName}&nbsp;{winner.lastName}</p>
            <p>
  <strong>الهاتف:</strong>{" "}
  <span style={{  unicodeBidi: "bidi-override" }}>
    {winner.phone.slice(0, -4) + "****"}
  </span>
</p>
            <p><strong>المدينة:</strong> {winner.city}</p>
            <p><strong>الكود:</strong> {winner.code}</p>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
          >
            {buttonText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 400ms cubic-bezier(.2,.9,.3,1);
        }

        @keyframes bounceRotate {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.05); }
          50% { transform: rotate(15deg) scale(1.1); }
          75% { transform: rotate(-8deg) scale(1.05); }
        }
        .animate-bounce-rotate {
          animation: bounceRotate 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}

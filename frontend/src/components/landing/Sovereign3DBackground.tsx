import React, { useRef, useEffect } from 'react';

/**
 * Sovereign3DBackground: Minimalist, systems-grade 3D topological dark-fiber canvas.
 * - Subtle geometric depth grid reacting to scroll velocity and mouse tilt
 * - No messy text labels or intrusive floating elements (clean, professional, non-AI-slop)
 * - 60 FPS hardware accelerated, zero dependencies
 */
export const Sovereign3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth || 1920;
    let height = window.innerHeight || 1080;

    const state = {
      scrollY: window.scrollY || 0,
      targetScrollY: window.scrollY || 0,
      mouseX: 0,
      mouseY: 0,
      targetMouseX: 0,
      targetMouseY: 0,
      time: 0,
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth || 1920;
      height = window.innerHeight || 1080;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };

    const handleScroll = () => {
      state.targetScrollY = window.scrollY || 0;
    };

    const handleMouseMove = (e: MouseEvent) => {
      state.targetMouseX = (e.clientX / (window.innerWidth || 1) - 0.5) * 2;
      state.targetMouseY = (e.clientY / (window.innerHeight || 1) - 0.5) * 2;
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Grid configuration: Perspective floor lattice
    const cols = 14;
    const rows = 12;
    const spacingX = 90;
    const spacingZ = 80;
    const baseY = 180;

    const render = () => {
      // Smooth interpolation for inertia
      state.scrollY += (state.targetScrollY - state.scrollY) * 0.08;
      state.mouseX += (state.targetMouseX - state.mouseX) * 0.05;
      state.mouseY += (state.targetMouseY - state.mouseY) * 0.05;
      state.time += 0.015;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Scroll-driven camera dynamics
      const scrollNorm = state.scrollY * 0.0005;
      const rotY = scrollNorm * 0.5 + state.mouseX * 0.08;
      const rotX = -0.32 + Math.sin(scrollNorm * 0.4) * 0.08 + state.mouseY * 0.06;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const cx = width * 0.5;
      const cy = height * 0.48;
      const fov = 450;
      const cameraDist = 420;

      const project = (x: number, y: number, z: number) => {
        // Wave undulation based on distance and scroll
        const wave = Math.sin(x * 0.008 + z * 0.008 + state.time + scrollNorm * 3) * 16;
        const ty = y + wave;

        const rx = x * cosY + z * sinY;
        const rz = -x * sinY + z * cosY;
        const ry = ty * cosX - rz * sinX;
        const finalZ = ty * sinX + rz * cosX;

        const depth = cameraDist + finalZ;
        if (depth <= 30) return { x: 0, y: 0, z: finalZ, scale: 0, visible: false };

        const scale = fov / depth;
        return {
          x: cx + rx * scale,
          y: cy + ry * scale,
          z: finalZ,
          scale,
          visible: true,
        };
      };

      // ── 1. PERSPECTIVE TOPOLOGY GRID LINES ──
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(198, 146, 59, 0.075)';

      // Draw horizontal lattice lines
      for (let r = -rows / 2; r <= rows / 2; r++) {
        ctx.beginPath();
        let started = false;
        for (let c = -cols / 2; c <= cols / 2; c++) {
          const pr = project(c * spacingX, baseY, r * spacingZ);
          if (pr.visible) {
            if (!started) {
              ctx.moveTo(pr.x, pr.y);
              started = true;
            } else {
              ctx.lineTo(pr.x, pr.y);
            }
          }
        }
        if (started) ctx.stroke();
      }

      // Draw vertical lattice lines
      for (let c = -cols / 2; c <= cols / 2; c++) {
        ctx.beginPath();
        let started = false;
        for (let r = -rows / 2; r <= rows / 2; r++) {
          const pr = project(c * spacingX, baseY, r * spacingZ);
          if (pr.visible) {
            if (!started) {
              ctx.moveTo(pr.x, pr.y);
              started = true;
            } else {
              ctx.lineTo(pr.x, pr.y);
            }
          }
        }
        if (started) ctx.stroke();
      }

      // ── 2. SUBTLE NETWORK INTERSECTION NODES ──
      for (let r = -rows / 2; r <= rows / 2; r += 2) {
        for (let c = -cols / 2; c <= cols / 2; c += 2) {
          const pr = project(c * spacingX, baseY, r * spacingZ);
          if (pr.visible) {
            const alpha = Math.max(0.08, Math.min(0.28, (pr.z + 200) / 400));
            ctx.beginPath();
            ctx.arc(pr.x, pr.y, 1.8 * pr.scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 163, 71, ${alpha})`;
            ctx.fill();
          }
        }
      }

      // ── 3. PACKET PULSES STREAMING ACROSS HORIZON ──
      for (let i = 0; i < 4; i++) {
        const pulseT = (state.time * 0.4 + i * 0.25 + scrollNorm * 2) % 1;
        const row = Math.floor(i * 2.5) - 3;
        const colStart = -cols / 2;
        const colEnd = cols / 2;
        const curCol = colStart + (colEnd - colStart) * pulseT;
        const pr = project(curCol * spacingX, baseY, row * spacingZ);
        if (pr.visible) {
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, 2.2 * pr.scale, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? 'rgba(245, 158, 11, 0.55)' : 'rgba(16, 185, 129, 0.55)';
          ctx.shadowBlur = 6;
          ctx.shadowColor = i % 2 === 0 ? '#F59E0B' : '#10B981';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full block select-none"
    />
  );
};

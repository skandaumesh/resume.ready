"use client";

import { useEffect, useRef } from "react";

interface GradientBlurProps {
  radius?: number;
  opacityDecay?: number;
  backgroundColor?: string;
  color?: [number, number, number];
  colorGenerator?: () => [number, number, number];
  className?: string;
}

// Mouse-follow colour glow, scoped to its own container (not the viewport) so
// it can be dropped into any relatively-positioned section — e.g. as a layer
// behind the footer wordmark — instead of only working full-screen.
export function GradientBlur({
  radius = 60,
  opacityDecay = 0.025,
  backgroundColor = "transparent",
  color,
  colorGenerator,
  className = "",
}: GradientBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const circsRef = useRef<
    Array<{
      col: [number, number, number];
      x: number;
      y: number;
      grdblur: CanvasGradient;
      alpha: number;
    }>
  >([]);

  const getColor = (): [number, number, number] =>
    color ||
    colorGenerator?.() || [
      Math.floor(Math.random() * 130 + 10),
      Math.floor(0.5 * Math.random() * 50),
      Math.floor(0.5 * Math.random() * 255),
    ];

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();

    let frame = 0;
    const draw = () => {
      ctx.globalCompositeOperation = "source-over";
      if (backgroundColor === "transparent") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.globalCompositeOperation = "lighter";

      circsRef.current.push({
        col: getColor(),
        x: mouseRef.current.x,
        y: mouseRef.current.y,
        grdblur: ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          radius
        ),
        alpha: 1,
      });

      const toRemove: number[] = [];
      for (let i = 0; i < circsRef.current.length; i++) {
        const circ = circsRef.current[i];

        circ.grdblur.addColorStop(0, `rgba(${circ.col[0]},${circ.col[1]},${circ.col[2]},0.95)`);
        circ.grdblur.addColorStop(0.2, `rgba(${circ.col[0]},${circ.col[1]},${circ.col[2]},0.7)`);
        circ.grdblur.addColorStop(0.5, `rgba(${circ.col[0]},${circ.col[1]},${circ.col[2]},0.3)`);
        circ.grdblur.addColorStop(1, `rgba(${circ.col[0]},${circ.col[1]},${circ.col[2]},0)`);

        ctx.beginPath();
        ctx.fillStyle = circ.grdblur;
        ctx.globalAlpha = circ.alpha;
        ctx.arc(circ.x, circ.y, radius, 0, Math.PI * 2);
        ctx.fill();

        circ.alpha -= opacityDecay;
        if (circ.alpha <= 0) toRemove.push(i);
      }

      for (let i = toRemove.length - 1; i >= 0; i--) {
        circsRef.current.splice(toRemove[i], 1);
      }

      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    window.addEventListener("pointermove", handlePointerMove);
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);

    frame = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [radius, opacityDecay, backgroundColor, color, colorGenerator]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const CRAB_SIZE = 450;
const SPEED = 1;
const EDGE_OVERSHOOT = 40; // pixels past the edge before bouncing

export default function BouncingCrab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const posRef = useRef({ x: 50, y: 50 });
  const velRef = useRef({ x: SPEED, y: SPEED });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;
    let animationId: number;

    const animate = () => {
      const rect = container.getBoundingClientRect();
      const minX = -EDGE_OVERSHOOT;
      const maxX = rect.width - CRAB_SIZE + EDGE_OVERSHOOT;
      const minY = -EDGE_OVERSHOOT;
      const maxY = rect.height - CRAB_SIZE + EDGE_OVERSHOOT;

      let { x, y } = posRef.current;
      let { x: vx, y: vy } = velRef.current;

      x += vx;
      y += vy;

      if (x <= minX) {
        x = minX;
        velRef.current.x = Math.abs(vx);
      } else if (x >= maxX) {
        x = maxX;
        velRef.current.x = -Math.abs(vx);
      }

      if (y <= minY) {
        y = minY;
        velRef.current.y = Math.abs(vy);
      } else if (y >= maxY) {
        y = maxY;
        velRef.current.y = -Math.abs(vy);
      }

      posRef.current = { x, y };
      container.style.setProperty("--crab-x", `${x}px`);
      container.style.setProperty("--crab-y", `${y}px`);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [mounted]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={
        {
          "--crab-x": "50px",
          "--crab-y": "50px",
        } as React.CSSProperties
      }
    >
      <div
        className="absolute animate-spin-counter-clockwise"
        style={{
          left: "var(--crab-x)",
          top: "var(--crab-y)",
          width: CRAB_SIZE,
          height: CRAB_SIZE,
        }}
      >
        <Image
          src="/images/cartoon-crab.png"
          alt=""
          width={CRAB_SIZE}
          height={CRAB_SIZE}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

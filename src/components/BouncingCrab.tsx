"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const CRAB_SIZE = 450;
const SPEED = 1.5;
const EDGE_OVERSHOOT = 80;
const TELEPORT_DURATION_MS = 1000;
const TELEPORT_LEAD_TIME_SEC = 6;
const FPS = 60;

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

function stepPhysics(
  pos: { x: number; y: number },
  vel: { x: number; y: number },
  bounds: Bounds
): { pos: { x: number; y: number }; vel: { x: number; y: number } } {
  let { x, y } = pos;
  let { x: vx, y: vy } = vel;
  const { minX, maxX, minY, maxY } = bounds;

  x += vx;
  y += vy;

  if (x <= minX) {
    x = minX;
    vx = Math.abs(vx);
  } else if (x >= maxX) {
    x = maxX;
    vx = -Math.abs(vx);
  }
  if (y <= minY) {
    y = minY;
    vy = Math.abs(vy);
  } else if (y >= maxY) {
    y = maxY;
    vy = -Math.abs(vy);
  }

  return { pos: { x, y }, vel: { x: vx, y: vy } };
}

function simulateBounce(
  startPos: { x: number; y: number },
  startVel: { x: number; y: number },
  bounds: Bounds,
  steps: number
): { pos: { x: number; y: number }; vel: { x: number; y: number } } {
  let pos = { ...startPos };
  let vel = { ...startVel };
  for (let i = 0; i < steps; i++) {
    const result = stepPhysics(pos, vel, bounds);
    pos = result.pos;
    vel = result.vel;
  }
  return { pos, vel };
}

export default function BouncingCrab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const posRef = useRef({ x: 50, y: 50 });
  const velRef = useRef({ x: SPEED, y: SPEED });
  const newCrabPosRef = useRef<{ x: number; y: number } | null>(null);
  const newCrabVelRef = useRef<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  const getBounds = useCallback((): Bounds | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const rawMaxX = rect.width - CRAB_SIZE + EDGE_OVERSHOOT;
    const rawMaxY = rect.height - CRAB_SIZE + EDGE_OVERSHOOT;
    const minX = -EDGE_OVERSHOOT;
    const maxX = Math.max(minX, rawMaxX);
    const minY = -EDGE_OVERSHOOT;
    const maxY = Math.max(minY, rawMaxY);
    return { minX, maxX, minY, maxY };
  }, []);

  const handleCrabClick = useCallback(() => {
    if (isTransitioning) return;

    const bounds = getBounds();
    if (!bounds) return;

    const steps = Math.round(TELEPORT_LEAD_TIME_SEC * FPS);
    const { pos: futurePos, vel: futureVel } = simulateBounce(
      { ...posRef.current },
      { ...velRef.current },
      bounds,
      steps
    );

    newCrabPosRef.current = futurePos;
    newCrabVelRef.current = futureVel;
    if (containerRef.current) {
      containerRef.current.style.setProperty("--new-crab-x", `${futurePos.x}px`);
      containerRef.current.style.setProperty("--new-crab-y", `${futurePos.y}px`);
    }
    setIsTransitioning(true);
    setFadeOut(false);
    setFadeIn(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFadeOut(true);
        setFadeIn(true);
      });
    });

    setTimeout(() => {
      posRef.current = newCrabPosRef.current!;
      velRef.current = newCrabVelRef.current!;
      newCrabPosRef.current = null;
      newCrabVelRef.current = null;
      setIsTransitioning(false);
    }, TELEPORT_DURATION_MS);
  }, [isTransitioning, getBounds]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;

    const animate = () => {
      const bounds = getBounds();
      if (!bounds) return;

      // Update main crab (fading out during transition)
      const mainResult = stepPhysics(
        posRef.current,
        velRef.current,
        bounds
      );
      posRef.current = mainResult.pos;
      velRef.current = mainResult.vel;
      container.style.setProperty("--crab-x", `${posRef.current.x}px`);
      container.style.setProperty("--crab-y", `${posRef.current.y}px`);

      // Update new crab during transition
      if (newCrabPosRef.current && newCrabVelRef.current) {
        const newResult = stepPhysics(
          newCrabPosRef.current,
          newCrabVelRef.current,
          bounds
        );
        newCrabPosRef.current = newResult.pos;
        newCrabVelRef.current = newResult.vel;
        container.style.setProperty("--new-crab-x", `${newCrabPosRef.current.x}px`);
        container.style.setProperty("--new-crab-y", `${newCrabPosRef.current.y}px`);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mounted, getBounds]);

  const renderCrab = (
    position: "main" | "new" | { x: number; y: number },
    opacity: number,
    isFading: boolean
  ) => (
    <div
      className="absolute animate-spin-counter-clockwise cursor-pointer select-none"
      style={{
        left:
          position === "main"
            ? "var(--crab-x)"
            : position === "new"
              ? "var(--new-crab-x)"
              : `${position.x}px`,
        top:
          position === "main"
            ? "var(--crab-y)"
            : position === "new"
              ? "var(--new-crab-y)"
              : `${position.y}px`,
        width: CRAB_SIZE,
        height: CRAB_SIZE,
        opacity,
        transition: isFading
          ? `opacity ${TELEPORT_DURATION_MS}ms ease-in-out`
          : "none",
        pointerEvents: isTransitioning ? "none" : "auto",
      }}
      onClick={handleCrabClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleCrabClick();
      }}
    >
      <Image
        src="/images/cartoon-crab.png"
        alt="Click to teleport"
        width={CRAB_SIZE}
        height={CRAB_SIZE}
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={
        {
          "--crab-x": "50px",
          "--crab-y": "50px",
          "--new-crab-x": "50px",
          "--new-crab-y": "50px",
        } as React.CSSProperties
      }
    >
      {renderCrab(
        "main",
        isTransitioning && fadeOut ? 0 : 1,
        isTransitioning
      )}
      {isTransitioning && renderCrab("new", fadeIn ? 1 : 0, true)}
    </div>
  );
}

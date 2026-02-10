"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const CRAB_SIZE = 125;
const CRAB_RADIUS = CRAB_SIZE / 2;
const BALL_RADII = [30, 28, 24, 22, 20, 18, 15, 26, 25, 23, 21, 19, 17, 14]; // 14 balls
const BASE_SPEED = 2;
const TELEPORT_FADE_MS = 800;
const EDGE_PADDING = 5;

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

type Entity = {
  id: string;
  type: "ball" | "crab";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fadingOut: boolean;
  opacity: number;
};

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function resolveElasticCollision(
  e1: Entity,
  e2: Entity,
  dx: number,
  dy: number,
  dist: number
) {
  if (dist === 0) return;
  const nx = dx / dist;
  const ny = dy / dist;
  const m1 = Math.PI * e1.radius * e1.radius;
  const m2 = Math.PI * e2.radius * e2.radius;
  const v1n = e1.vx * nx + e1.vy * ny;
  const v2n = e2.vx * nx + e2.vy * ny;
  if (v1n - v2n >= 0) return; // moving apart
  const v1nNew = ((m1 - m2) * v1n + 2 * m2 * v2n) / (m1 + m2);
  const v2nNew = ((m2 - m1) * v2n + 2 * m1 * v1n) / (m1 + m2);
  e1.vx += (v1nNew - v1n) * nx;
  e1.vy += (v1nNew - v1n) * ny;
  e2.vx += (v2nNew - v2n) * nx;
  e2.vy += (v2nNew - v2n) * ny;
}

function separateOverlap(
  e1: Entity,
  e2: Entity,
  dx: number,
  dy: number,
  dist: number,
  overlap: number
) {
  if (dist === 0) return;
  const nx = dx / dist;
  const ny = dy / dist;
  const totalRadius = e1.radius + e2.radius;
  const m1 = Math.PI * e1.radius * e1.radius;
  const m2 = Math.PI * e2.radius * e2.radius;
  const totalM = m1 + m2;
  e1.x -= (overlap * m2 / totalM) * nx;
  e1.y -= (overlap * m2 / totalM) * ny;
  e2.x += (overlap * m1 / totalM) * nx;
  e2.y += (overlap * m1 / totalM) * ny;
}

export default function BouncingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [entityDefs, setEntityDefs] = useState<{ id: string; type: "ball" | "crab"; radius: number }[]>([]);
  const entitiesRef = useRef<Entity[]>([]);
  const animationRef = useRef<number | null>(null);

  const getBounds = useCallback((): Bounds | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      minX: EDGE_PADDING,
      maxX: rect.width - EDGE_PADDING,
      minY: EDGE_PADDING,
      maxY: rect.height - EDGE_PADDING,
    };
  }, []);

  const getRandomUnoccupiedPosition = useCallback(
    (radius: number, excludeId: string): { x: number; y: number } | null => {
      const bounds = getBounds();
      if (!bounds) return null;
      const others = entitiesRef.current.filter((e) => e.id !== excludeId);
      const padding = 15;
      for (let attempt = 0; attempt < 100; attempt++) {
        const x =
          bounds.minX +
          radius +
          Math.random() * (bounds.maxX - bounds.minX - 2 * radius);
        const y =
          bounds.minY +
          radius +
          Math.random() * (bounds.maxY - bounds.minY - 2 * radius);
        let ok = true;
        for (const e of others) {
          if (e.fadingOut) continue;
          const d = distance(x, y, e.x, e.y);
          if (d < radius + e.radius + padding) {
            ok = false;
            break;
          }
        }
        if (ok) return { x, y };
      }
      return null;
    },
    [getBounds]
  );

  const initEntities = useCallback(() => {
    const bounds = getBounds();
    if (!bounds) return;

    const entities: Entity[] = [];
    const angle = () => (Math.random() * 2 - 1) * Math.PI * 0.5;

    const crab: Entity = {
      id: "crab",
      type: "crab",
      x: bounds.minX + (bounds.maxX - bounds.minX) * 0.5,
      y: bounds.minY + (bounds.maxY - bounds.minY) * 0.5,
      vx: BASE_SPEED * Math.cos(angle()),
      vy: BASE_SPEED * Math.sin(angle()),
      radius: CRAB_RADIUS,
      fadingOut: false,
      opacity: 1,
    };
    entities.push(crab);

    for (let i = 0; i < BALL_RADII.length; i++) {
      const r = BALL_RADII[i];
      let x: number, y: number;
      let ok = false;
      for (let t = 0; t < 50; t++) {
        x = bounds.minX + r + Math.random() * (bounds.maxX - bounds.minX - 2 * r);
        y = bounds.minY + r + Math.random() * (bounds.maxY - bounds.minY - 2 * r);
        ok = true;
        for (const e of entities) {
          if (distance(x, y, e.x, e.y) < r + e.radius + 10) {
            ok = false;
            break;
          }
        }
        if (ok) break;
      }
      if (!ok) continue;
      entities.push({
        id: `ball-${i}`,
        type: "ball",
        x: x!,
        y: y!,
        vx: BASE_SPEED * (Math.random() * 2 - 1),
        vy: BASE_SPEED * (Math.random() * 2 - 1),
        radius: r,
        fadingOut: false,
        opacity: 1,
      });
    }

    entitiesRef.current = entities;
    setEntityDefs(entities.map((e) => ({ id: e.id, type: e.type, radius: e.radius })));
  }, [getBounds]);

  const [, forceUpdate] = useState(0);
  const handleEntityClick = useCallback(
    (id: string) => {
      const entity = entitiesRef.current.find((e) => e.id === id);
      if (!entity || entity.fadingOut) return;

      entity.fadingOut = true;
      forceUpdate((n) => n + 1);

      const newPos = getRandomUnoccupiedPosition(entity.radius, id);
      if (!newPos) {
        entity.fadingOut = false;
        return;
      }

      setTimeout(() => {
        entity.x = newPos.x;
        entity.y = newPos.y;
        entity.fadingOut = false;
        entity.opacity = 1;
      }, TELEPORT_FADE_MS);
    },
    [getRandomUnoccupiedPosition]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    initEntities();
    const container = containerRef.current;

    const animate = () => {
      const bounds = getBounds();
      if (!bounds) return;

      const entities = entitiesRef.current;
      const dt = 1;

      for (const e of entities) {
        if (e.fadingOut) {
          e.opacity = Math.max(0, e.opacity - (1 / TELEPORT_FADE_MS) * (1000 / 60));
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        if (e.x - e.radius <= bounds.minX) {
          e.x = bounds.minX + e.radius;
          e.vx = Math.abs(e.vx);
        } else if (e.x + e.radius >= bounds.maxX) {
          e.x = bounds.maxX - e.radius;
          e.vx = -Math.abs(e.vx);
        }
        if (e.y - e.radius <= bounds.minY) {
          e.y = bounds.minY + e.radius;
          e.vy = Math.abs(e.vy);
        } else if (e.y + e.radius >= bounds.maxY) {
          e.y = bounds.maxY - e.radius;
          e.vy = -Math.abs(e.vy);
        }
      }

      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const e1 = entities[i];
          const e2 = entities[j];
          if (e1.fadingOut || e2.fadingOut) continue;
          const dx = e2.x - e1.x;
          const dy = e2.y - e1.y;
          const dist = distance(e1.x, e1.y, e2.x, e2.y);
          const overlap = e1.radius + e2.radius - dist;
          if (overlap > 0) {
            separateOverlap(e1, e2, dx, dy, dist || 0.001, overlap);
            const newDx = e2.x - e1.x;
            const newDy = e2.y - e1.y;
            const newDist = distance(e1.x, e1.y, e2.x, e2.y);
            resolveElasticCollision(e1, e2, newDx, newDy, newDist || 0.001);
          }
        }
      }

      for (const e of entities) {
        container.style.setProperty(
          `--${e.id}-x`,
          `${e.x - e.radius}px`
        );
        container.style.setProperty(
          `--${e.id}-y`,
          `${e.y - e.radius}px`
        );
        container.style.setProperty(`--${e.id}-opacity`, String(e.opacity));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mounted, getBounds, initEntities]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: "var(--bubbles)" } as React.CSSProperties}
    >
      {/* Corner decorative lines - bottom-left and bottom-right */}
      <svg
        className="absolute bottom-0 left-0 w-48 h-32 pointer-events-none"
        viewBox="0 0 80 60"
        preserveAspectRatio="none"
      >
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1="0"
            y1="60"
            x2={20 + i * 15}
            y2={10 - i * 5}
            stroke="var(--background)"
            strokeWidth="2"
          />
        ))}
      </svg>
      <svg
        className="absolute bottom-0 right-0 w-48 h-32 pointer-events-none"
        viewBox="0 0 80 60"
        preserveAspectRatio="none"
      >
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1="80"
            y1="60"
            x2={60 - i * 15}
            y2={10 - i * 5}
            stroke="var(--background)"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Entities */}
      {entityDefs.map((def) => {
        const full = entitiesRef.current.find((x) => x.id === def.id);
        const fadingOut = full?.fadingOut ?? false;
        return def.type === "ball" ? (
          <div
            key={def.id}
            className="absolute rounded-full cursor-pointer"
            style={{
              left: `var(--${def.id}-x, 0)`,
              top: `var(--${def.id}-y, 0)`,
              width: def.radius * 2,
              height: def.radius * 2,
              backgroundColor: "var(--background)",
              opacity: `var(--${def.id}-opacity, 1)`,
              transition: "none",
            }}
            onClick={() => handleEntityClick(def.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") handleEntityClick(def.id);
            }}
          />
        ) : (
          <div
            key={def.id}
            className="absolute cursor-pointer"
            style={{
              left: `var(--${def.id}-x, 0)`,
              top: `var(--${def.id}-y, 0)`,
              width: CRAB_SIZE,
              height: CRAB_SIZE,
              opacity: `var(--${def.id}-opacity, 1)`,
              transition: "none",
            }}
            onClick={() => handleEntityClick(def.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") handleEntityClick(def.id);
            }}
          >
            <Image
              src="/images/cartoon-crab.png"
              alt="Terrence the crab"
              width={CRAB_SIZE}
              height={CRAB_SIZE}
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
}

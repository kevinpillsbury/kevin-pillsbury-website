"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const CRAB_SIZE = 96;
const CRAB_RADIUS = CRAB_SIZE / 2;
const BASE_SPEED = 1.5;
const EDGE_PADDING = 5;

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

type Entity = {
  id: string;
  type: "crab";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number; // half side length of the square or crab's collision radius
};

/** Box bounds (entity center + half-size). */
function getBoxBounds(e: Entity) {
  return {
    minX: e.x - e.radius,
    maxX: e.x + e.radius,
    minY: e.y - e.radius,
    maxY: e.y + e.radius,
  };
}

type RectObstacle = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/** AABB overlap: returns overlap amounts; both > 0 means collision. */
function aabbOverlap(
  a: { minX: number; maxX: number; minY: number; maxY: number },
  b: { minX: number; maxX: number; minY: number; maxY: number }
) {
  const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  return { overlapX, overlapY };
}

/** Mass proportional to area of square (side = 2*radius). */
export default function BouncingScene({
  obstacleSelector,
}: {
  obstacleSelector?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [hasCrab, setHasCrab] = useState(false);
  const entitiesRef = useRef<Entity[]>([]);
  const animationRef = useRef<number | null>(null);
  const [isCrabFading, setIsCrabFading] = useState(false);
  const crabClickCountRef = useRef(0);
  const crabClickTimeoutRef = useRef<number | null>(null);
  const crabTeleportTimeoutRef = useRef<number | null>(null);
  const obstacleRef = useRef<RectObstacle | null>(null);

  // Default keeps backwards compat for old home layout class name.
  const resolvedObstacleSelector = obstacleSelector ?? ".home-bio-window";

  useEffect(() => {
    return () => {
      if (crabClickTimeoutRef.current !== null) {
        window.clearTimeout(crabClickTimeoutRef.current);
      }
      if (crabTeleportTimeoutRef.current !== null) {
        window.clearTimeout(crabTeleportTimeoutRef.current);
      }
    };
  }, []);

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

  const computeObstacle = useCallback((): RectObstacle | null => {
    if (!containerRef.current) return null;
    const containerRect = containerRef.current.getBoundingClientRect();
    const el =
      typeof document !== "undefined"
        ? document.querySelector<HTMLElement>(resolvedObstacleSelector)
        : null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      minX: r.left - containerRect.left,
      maxX: r.right - containerRect.left,
      minY: r.top - containerRect.top,
      maxY: r.bottom - containerRect.top,
    };
  }, [resolvedObstacleSelector]);

  const initEntities = useCallback(() => {
    const bounds = getBounds();
    if (!bounds) return;

    const obs = computeObstacle();
    obstacleRef.current = obs;

    const entities: Entity[] = [];

    // Spawn spinning crab near center, nudged upward if the obstacle exists.
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY =
      (bounds.minY + bounds.maxY) / 2 -
      (obs ? (obs.maxY - obs.minY) / 2 + CRAB_RADIUS + 16 : 0);
    entities.push({
      id: "crab",
      type: "crab",
      x: centerX,
      y: centerY,
      vx: BASE_SPEED * (Math.random() * 2 - 1),
      vy: BASE_SPEED * (Math.random() * 2 - 1),
      radius: CRAB_RADIUS,
    });

    entitiesRef.current = entities;
    setHasCrab(true);
  }, [getBounds, computeObstacle]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;

    const startAnimation = () => {
      initEntities();
      const animate = () => {
        const bounds = getBounds();
        if (!bounds) return;
        const obs = computeObstacle();
        if (obs) obstacleRef.current = obs;

        const entities = entitiesRef.current;
        const dt = 1;

        for (const e of entities) {
          e.x += e.vx * dt;
          e.y += e.vy * dt;

          // Bounce off container bounds
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

          // Bounce off obstacle rectangle (e.g. the home video panel)
          if (obs) {
            const box = getBoxBounds(e);
            const { overlapX, overlapY } = aabbOverlap(box, obs);
            if (overlapX > 0 && overlapY > 0) {
              // push entity out of obstacle rect
              if (overlapX < overlapY) {
                if (e.x < (obs.minX + obs.maxX) / 2) {
                  e.x = obs.minX - e.radius;
                  e.vx = -Math.abs(e.vx);
                } else {
                  e.x = obs.maxX + e.radius;
                  e.vx = Math.abs(e.vx);
                }
              } else {
                if (e.y < (obs.minY + obs.maxY) / 2) {
                  e.y = obs.minY - e.radius;
                  e.vy = -Math.abs(e.vy);
                } else {
                  e.y = obs.maxY + e.radius;
                  e.vy = Math.abs(e.vy);
                }
              }
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
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(() => {
      requestAnimationFrame(startAnimation);
    });
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mounted, getBounds, initEntities, computeObstacle]);

  const teleportCrabRandomly = useCallback(() => {
    const crab = entitiesRef.current.find((e) => e.type === "crab");
    if (!crab) return;
    const bounds = getBounds();
    if (!bounds) return;
    const r = crab.radius;
    const obs = obstacleRef.current;
    for (let attempt = 0; attempt < 100; attempt++) {
      const x =
        bounds.minX + r + Math.random() * (bounds.maxX - bounds.minX - 2 * r);
      const y =
        bounds.minY + r + Math.random() * (bounds.maxY - bounds.minY - 2 * r);
      if (obs) {
        const box = { minX: x - r, maxX: x + r, minY: y - r, maxY: y + r };
        const { overlapX, overlapY } = aabbOverlap(box, obs);
        if (overlapX > 0 && overlapY > 0) continue;
      }
      crab.x = x;
      crab.y = y;
      break;
    }
  }, [getBounds]);

  const handleCrabClick = useCallback(() => {
    // Manage double-click detection
    if (crabClickTimeoutRef.current !== null) {
      window.clearTimeout(crabClickTimeoutRef.current);
    }

    crabClickCountRef.current += 1;

    // Double click: show easter egg message instead of teleport
    if (crabClickCountRef.current >= 2) {
      crabClickCountRef.current = 0;
      crabClickTimeoutRef.current = null;

      if (crabTeleportTimeoutRef.current !== null) {
        window.clearTimeout(crabTeleportTimeoutRef.current);
        crabTeleportTimeoutRef.current = null;
      }

      setIsCrabFading(false);
      window.location.assign("/secret-page");
      return;
    }

    // First click: start fade and schedule teleport if not already fading
    if (crabClickCountRef.current === 1 && !isCrabFading) {
      setIsCrabFading(true);
      crabTeleportTimeoutRef.current = window.setTimeout(() => {
        teleportCrabRandomly();
        setIsCrabFading(false);
        crabTeleportTimeoutRef.current = null;
      }, 1000);
    }

    // Reset click count after a short window
    crabClickTimeoutRef.current = window.setTimeout(() => {
      crabClickCountRef.current = 0;
      crabClickTimeoutRef.current = null;
    }, 600);
  }, [isCrabFading, teleportCrabRandomly]);

  const crabEntity = entitiesRef.current.find((e) => e.type === "crab");

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {hasCrab && crabEntity && (
        <button
          type="button"
          className={`absolute rounded-full overflow-hidden pointer-events-auto transition-[filter] duration-150 hover:brightness-110 ${
            isCrabFading ? "transition-opacity duration-1000" : ""
          }`}
          style={{
            left: `var(--${crabEntity.id}-x, 0)`,
            top: `var(--${crabEntity.id}-y, 0)`,
            width: crabEntity.radius * 2,
            height: crabEntity.radius * 2,
            border: "2px solid var(--text)",
            opacity: isCrabFading ? 0 : 1,
          }}
          onClick={handleCrabClick}
        >
          <Image
            src="/images/Terrence-Pincher-XIV.png"
            alt="Terrence the crab"
            width={crabEntity.radius * 2}
            height={crabEntity.radius * 2}
            className="w-full h-full object-contain crab-spin pointer-events-none"
            draggable={false}
          />
        </button>
      )}
    </div>
  );
}

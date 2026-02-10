"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, updateSession } from "@/lib/session-storage";

const BALL_RADII = [150, 95, 102, 76, 88, 140, 70, 90];
const BASE_SPEED = 2;
const TELEPORT_FADE_MS = 600;
const EDGE_PADDING = 5;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

type Entity = {
  id: string;
  type: "ball";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number; // half side length of the square
  fadingOut: boolean;
  opacity: number;
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
function mass(e: Entity) {
  return 4 * e.radius * e.radius;
}

/** Separate two overlapping AABBs along the axis of smallest penetration (push apart by mass ratio). */
function separateAABB(e1: Entity, e2: Entity, overlapX: number, overlapY: number) {
  const m1 = mass(e1);
  const m2 = mass(e2);
  const totalM = m1 + m2;
  if (overlapX < overlapY) {
    const push = overlapX;
    if (e1.x < e2.x) {
      e1.x -= (push * m2) / totalM;
      e2.x += (push * m1) / totalM;
    } else {
      e1.x += (push * m2) / totalM;
      e2.x -= (push * m1) / totalM;
    }
  } else {
    const push = overlapY;
    if (e1.y < e2.y) {
      e1.y -= (push * m2) / totalM;
      e2.y += (push * m1) / totalM;
    } else {
      e1.y += (push * m2) / totalM;
      e2.y -= (push * m1) / totalM;
    }
  }
}

/** Elastic collision response along one axis (1D formula). Normal is +1 or -1 on that axis. */
function resolveElasticAABB(
  e1: Entity,
  e2: Entity,
  axis: "x" | "y"
) {
  const m1 = mass(e1);
  const m2 = mass(e2);
  const v1 = axis === "x" ? e1.vx : e1.vy;
  const v2 = axis === "x" ? e2.vx : e2.vy;
  const v1New = (v1 * (m1 - m2) + 2 * m2 * v2) / (m1 + m2);
  const v2New = (v2 * (m2 - m1) + 2 * m1 * v1) / (m1 + m2);
  if (axis === "x") {
    e1.vx = v1New;
    e2.vx = v2New;
  } else {
    e1.vy = v1New;
    e2.vy = v2New;
  }
}

export default function BouncingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [entityDefs, setEntityDefs] = useState<{ id: string; type: "ball"; radius: number }[]>([]);
  const [blockTitles, setBlockTitles] = useState<string[] | null>(null);
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

  /** AABB overlap: two boxes (centers x,y and x2,y2 with half-sizes r and e.radius) overlap iff both axes overlap. */
  const boxesOverlap = useCallback(
    (x: number, y: number, r: number, ex: number, ey: number, er: number) => {
      return (
        Math.abs(x - ex) < r + er && Math.abs(y - ey) < r + er
      );
    },
    []
  );

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
          if (boxesOverlap(x, y, radius + padding, e.x, e.y, e.radius)) {
            ok = false;
            break;
          }
        }
        if (ok) return { x, y };
      }
      return null;
    },
    [getBounds, boxesOverlap]
  );

  const initEntities = useCallback(() => {
    const bounds = getBounds();
    if (!bounds) return;

    const entities: Entity[] = [];

    for (let i = 0; i < BALL_RADII.length; i++) {
      const r = BALL_RADII[i];
      let x: number, y: number;
      let ok = false;
      for (let t = 0; t < 50; t++) {
        x = bounds.minX + r + Math.random() * (bounds.maxX - bounds.minX - 2 * r);
        y = bounds.minY + r + Math.random() * (bounds.maxY - bounds.minY - 2 * r);
        ok = true;
        for (const e of entities) {
          if (Math.abs(x - e.x) < r + e.radius + 10 && Math.abs(y - e.y) < r + e.radius + 10) {
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
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Load or assign titles per block; persist in shared session so it survives navigation but resets on tab close.
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const N = BALL_RADII.length;
    const session = getSession();
    const stored = session.bouncingBlockTitles;
    if (Array.isArray(stored) && stored.length === N) {
      setBlockTitles(stored);
      return;
    }
    fetch("/api/compositions/titles")
      .then((res) => (res.ok ? res.json() : Promise.resolve({ titles: [] as string[] })))
      .then((data: { titles: string[] }) => {
        const all = data.titles ?? [];
        const shuffled = shuffle(all);
        const assigned: string[] = [];
        for (let i = 0; i < N; i++) {
          assigned.push(shuffled[i] ?? "");
        }
        updateSession({ bouncingBlockTitles: assigned });
        setBlockTitles(assigned);
      })
      .catch(() => setBlockTitles(Array(N).fill("")));
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;

    const startAnimation = () => {
      initEntities();
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
          const b1 = getBoxBounds(e1);
          const b2 = getBoxBounds(e2);
          const { overlapX, overlapY } = aabbOverlap(b1, b2);
          if (overlapX > 0 && overlapY > 0) {
            separateAABB(e1, e2, overlapX, overlapY);
            const axis: "x" | "y" = overlapX < overlapY ? "x" : "y";
            resolveElasticAABB(e1, e2, axis);
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
    };

    animationRef.current = requestAnimationFrame(startAnimation);
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
      {/* Entities */}
      {entityDefs.map((def, index) => {
        const title = blockTitles?.[index] ?? "";
        const side = def.radius * 2;
        const fontSizePx = Math.max(10, Math.min(Math.round(side * 0.2), 28));
        return (
          <div
            key={def.id}
            className="absolute rounded-xl cursor-pointer flex items-center justify-center overflow-hidden px-1"
            style={{
              left: `var(--${def.id}-x, 0)`,
              top: `var(--${def.id}-y, 0)`,
              width: side,
              height: side,
              backgroundColor: "var(--background)",
              border: "2px solid var(--text-borders)",
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
            {title && (
              <span
                className="text-center line-clamp-3 leading-tight"
                style={{
                  fontSize: fontSizePx,
                  color: "var(--text-borders)",
                }}
              >
                {title}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSession, updateSession } from "@/lib/session-storage";
import type { BouncingBlockAssignment } from "@/lib/session-storage";

const CRAB_SIZE = 96;
const CRAB_RADIUS = CRAB_SIZE / 2;
const BLOCK_SIZES = [112, 72, 77, 57, 66, 105, 52, 68];
const BASE_SPEED = 1.5;
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
  type: "block" | "crab";
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
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [entityDefs, setEntityDefs] = useState<{ id: string; radius: number }[]>([]);
  const [blockAssignments, setBlockAssignments] = useState<BouncingBlockAssignment[] | null>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const animationRef = useRef<number | null>(null);
  const [isCrabFading, setIsCrabFading] = useState(false);
  const crabClickCountRef = useRef(0);
  const crabClickTimeoutRef = useRef<number | null>(null);
  const crabTeleportTimeoutRef = useRef<number | null>(null);
  const bioObstacleRef = useRef<RectObstacle | null>(null);

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

  const computeBioObstacle = useCallback((): RectObstacle | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();

    // Approximate the bio window as a centered card with fixed-ish max width/height
    const maxBioWidth = Math.min(rect.width - 80, 640); // similar to max-w-xl with side padding
    const maxBioHeight = Math.min(rect.height - 80, 360);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const minX = centerX - maxBioWidth / 2;
    const maxX = centerX + maxBioWidth / 2;
    const minY = centerY - maxBioHeight / 2;
    const maxY = centerY + maxBioHeight / 2;

    return { minX, maxX, minY, maxY };
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

  const initEntities = useCallback(() => {
    const bounds = getBounds();
    if (!bounds) return;

    const bio = computeBioObstacle();
    bioObstacleRef.current = bio;

    const entities: Entity[] = [];

    // Spawn spinning crab slightly above the bio window center
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2 - (bio ? (bio.maxY - bio.minY) / 2 + CRAB_RADIUS + 16 : 0);
    entities.push({
      id: "crab",
      type: "crab",
      x: centerX,
      y: centerY,
      vx: BASE_SPEED * (Math.random() * 2 - 1),
      vy: BASE_SPEED * (Math.random() * 2 - 1),
      radius: CRAB_RADIUS,
    });

    // Spawn square blocks split on left/right of bio window and avoiding overlaps
    const totalBlocks = BLOCK_SIZES.length;
    const leftCount = Math.floor(totalBlocks / 2);
    const rightCount = totalBlocks - leftCount;

    const spawnBlock = (i: number, side: "left" | "right") => {
      const r = BLOCK_SIZES[i];
      let x: number = 0;
      let y: number = 0;
      let ok = false;

      const horizontalMin =
        side === "left"
          ? bounds.minX + r
          : bio
          ? bio.maxX + r
          : bounds.minX + r;
      const horizontalMax =
        side === "left"
          ? (bio ? bio.minX : bounds.maxX) - r
          : bounds.maxX - r;

      for (let t = 0; t < 60; t++) {
        x =
          horizontalMin +
          Math.random() * Math.max(0, horizontalMax - horizontalMin);
        y =
          bounds.minY +
          r +
          Math.random() * (bounds.maxY - bounds.minY - 2 * r);
        ok = true;

        // avoid overlapping existing entities
        for (const e of entities) {
          if (
            Math.abs(x - e.x) < r + e.radius + 10 &&
            Math.abs(y - e.y) < r + e.radius + 10
          ) {
            ok = false;
            break;
          }
        }

        // avoid spawning inside bio window
        if (ok && bio) {
          const box = {
            minX: x - r,
            maxX: x + r,
            minY: y - r,
            maxY: y + r,
          };
          const { overlapX, overlapY } = aabbOverlap(box, bio);
          if (overlapX > 0 && overlapY > 0) {
            ok = false;
          }
        }

        if (ok) break;
      }

      if (!ok) return;

      entities.push({
        id: `block-${i}`,
        type: "block",
        x,
        y,
        vx: BASE_SPEED * (Math.random() * 2 - 1),
        vy: BASE_SPEED * (Math.random() * 2 - 1),
        radius: r,
      });
    };

    for (let i = 0; i < leftCount; i++) {
      spawnBlock(i, "left");
    }
    for (let i = leftCount; i < totalBlocks; i++) {
      spawnBlock(i, "right");
    }

    entitiesRef.current = entities;
    setEntityDefs(
      entities
        .filter((e) => e.type === "block")
        .map((e) => ({ id: e.id, radius: e.radius }))
    );
  }, [getBounds, computeBioObstacle]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Load or assign composition links per block; persist in shared session so it survives navigation but resets on tab close.
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const N = BLOCK_SIZES.length;
    const session = getSession();
    const stored = session.bouncingBlockAssignments;
    if (Array.isArray(stored) && stored.length === N) {
      setBlockAssignments(stored);
      return;
    }
    fetch("/api/compositions/titles")
      .then((res) =>
        res.ok ? res.json() : Promise.resolve({ compositions: [] as BouncingBlockAssignment[] })
      )
      .then((data: { compositions: BouncingBlockAssignment[] }) => {
        const all = data.compositions ?? [];
        const shuffled = shuffle(all);
        const assigned: BouncingBlockAssignment[] = [];
        for (let i = 0; i < N; i++) {
          assigned.push(shuffled[i] ?? { id: "", title: "", genreSlug: "" });
        }
        updateSession({ bouncingBlockAssignments: assigned });
        setBlockAssignments(assigned);
      })
      .catch(() => setBlockAssignments(Array(N).fill({ id: "", title: "", genreSlug: "" })));
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;

    const startAnimation = () => {
      initEntities();
      const animate = () => {
        const bounds = getBounds();
        if (!bounds) return;
        const bio = bioObstacleRef.current ?? computeBioObstacle();
        if (!bioObstacleRef.current && bio) {
          bioObstacleRef.current = bio;
        }

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

          // Bounce off central bio window
          if (bio) {
            const box = getBoxBounds(e);
            const { overlapX, overlapY } = aabbOverlap(box, bio);
            if (overlapX > 0 && overlapY > 0) {
              // push entity out of the bio rect
              if (overlapX < overlapY) {
                if (e.x < (bio.minX + bio.maxX) / 2) {
                  e.x = bio.minX - e.radius;
                  e.vx = -Math.abs(e.vx);
                } else {
                  e.x = bio.maxX + e.radius;
                  e.vx = Math.abs(e.vx);
                }
              } else {
                if (e.y < (bio.minY + bio.maxY) / 2) {
                  e.y = bio.minY - e.radius;
                  e.vy = -Math.abs(e.vy);
                } else {
                  e.y = bio.maxY + e.radius;
                  e.vy = Math.abs(e.vy);
                }
              }
            }
          }
        }

        for (let i = 0; i < entities.length; i++) {
          for (let j = i + 1; j < entities.length; j++) {
            const e1 = entities[i];
            const e2 = entities[j];
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
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(startAnimation);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mounted, getBounds, initEntities, computeBioObstacle]);

  const teleportCrabRandomly = useCallback(() => {
    const crab = entitiesRef.current.find((e) => e.type === "crab");
    if (!crab) return;
    const bounds = getBounds();
    if (!bounds) return;
    const others = entitiesRef.current.filter((e) => e.id !== crab.id);
    const r = crab.radius;
    for (let attempt = 0; attempt < 100; attempt++) {
      const x =
        bounds.minX + r + Math.random() * (bounds.maxX - bounds.minX - 2 * r);
      const y =
        bounds.minY + r + Math.random() * (bounds.maxY - bounds.minY - 2 * r);
      let ok = true;
      for (const other of others) {
        if (boxesOverlap(x, y, r, other.x, other.y, other.radius)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        crab.x = x;
        crab.y = y;
        break;
      }
    }
  }, [getBounds, boxesOverlap]);

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
      router.push("/secret-page");
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
  }, [isCrabFading, teleportCrabRandomly, router]);

  const crabEntity = entitiesRef.current.find((e) => e.type === "crab");

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: "var(--background)" } as React.CSSProperties}
    >
      {/* Entities */}
      {entityDefs.map((def, index) => {
        const assignment = blockAssignments?.[index];
        const side = def.radius * 2;
        const fontSizePx = Math.max(8, Math.min(Math.round(side * 0.15), 20));
        const href =
          assignment?.id && assignment?.genreSlug
            ? `/${assignment.genreSlug}`
            : null;
        const blockStyle = {
          left: `var(--${def.id}-x, 0)` as const,
          top: `var(--${def.id}-y, 0)` as const,
          width: side,
          height: side,
          backgroundColor: "var(--bubbles)",
          border: "2px solid var(--text-borders)",
          transition: "none" as const,
          color: "var(--text-borders)",
        };
        const content = assignment?.title ? (
          <span
            className="text-center line-clamp-3 leading-tight"
            style={{ fontSize: fontSizePx, color: "var(--text-borders)" }}
          >
            {assignment.title}
          </span>
        ) : null;
        return href ? (
          <Link
            key={def.id}
            href={href}
            className="absolute rounded-xl cursor-pointer flex items-center justify-center overflow-hidden px-1 no-underline"
            style={blockStyle}
            onClick={() => {
              if (assignment?.id && assignment?.genreSlug) {
                updateSession({
                  pendingComposition: {
                    genreSlug: assignment.genreSlug,
                    id: assignment.id,
                  },
                });
              }
            }}
          >
            {content}
          </Link>
        ) : (
          <div
            key={def.id}
            className="absolute rounded-xl flex items-center justify-center overflow-hidden px-1"
            style={blockStyle}
          >
            {content}
          </div>
        );
      })}

      {crabEntity && (
        <button
          type="button"
          className={`absolute rounded-full overflow-hidden ${
            isCrabFading ? "transition-opacity duration-1000" : ""
          }`}
          style={{
            left: `var(--${crabEntity.id}-x, 0)`,
            top: `var(--${crabEntity.id}-y, 0)`,
            width: crabEntity.radius * 2,
            height: crabEntity.radius * 2,
            border: "2px solid var(--text-borders)",
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

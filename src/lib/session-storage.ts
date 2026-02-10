/**
 * Single session-storage key for all tab-scoped app state.
 * Survives navigation; cleared when the tab is closed.
 */

const SESSION_KEY = "kpw_session_v1";
const LEGACY_CHAT_KEY = "kpw_chat_messages_v1";

export type Session = {
  chatMessages?: Array<{ role: string; content: string }>;
  bouncingBlockTitles?: string[];
};

function parseSession(raw: string | null): Session {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return {};
    const obj = data as Record<string, unknown>;
    const session: Session = {};
    if (Array.isArray(obj.chatMessages)) {
      session.chatMessages = obj.chatMessages.filter(
        (m): m is { role: string; content: string } =>
          m != null &&
          typeof m === "object" &&
          typeof (m as { role?: unknown }).role === "string" &&
          typeof (m as { content?: unknown }).content === "string"
      );
    }
    if (Array.isArray(obj.bouncingBlockTitles)) {
      session.bouncingBlockTitles = obj.bouncingBlockTitles.filter(
        (t): t is string => typeof t === "string"
      );
    }
    return session;
  } catch {
    return {};
  }
}

/** Read session; migrates from legacy chat key if present. */
export function getSession(): Session {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return parseSession(raw);

    const legacyRaw = sessionStorage.getItem(LEGACY_CHAT_KEY);
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw) as unknown;
        if (Array.isArray(legacy)) {
          const session: Session = { chatMessages: legacy as Session["chatMessages"] };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
          sessionStorage.removeItem(LEGACY_CHAT_KEY);
          return session;
        }
      } catch {
        // ignore invalid legacy data
      }
    }
    return {};
  } catch {
    return {};
  }
}

/** Update session by merging partial state and persisting. */
export function updateSession(updates: Partial<Session>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getSession();
    const next: Session = {
      ...current,
      ...updates,
    };
    if (Object.keys(next).length === 0) {
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore storage errors
  }
}

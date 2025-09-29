import { getMovePiece, getMoveCapture, getMovePromoted, getMoveCastle } from '~/game/move/move-def';

const isBrowser = typeof window !== 'undefined' && typeof Audio !== 'undefined';

// Config
const SOUND_CATEGORIES = ['capture', 'move-check', 'move-self', 'promote'] as const;
const OTHER_SOUNDS = ['castle', 'game-end'] as const;

/**
 * Caches
 * - loadedSounds: URL -> Audio (successfully loaded)
 * - preloadUrlPromises: URL -> Promise<void> (in-flight preload)
 * - resolvedSoundMap: `${category}-${pieceId|special}` -> resolved working URL
 */
const loadedSounds: Record<string, HTMLAudioElement> = {};
const preloadUrlPromises: Record<string, Promise<void> | undefined> = {};
const resolvedSoundMap: Record<string, string> = {};

/**
 * Build candidate URLs in fallback order.
 * For a pieceId (e.g. 15) candidates are:
 *  - /piece/sound/{category}/15.mp3
 *  - /piece/sound/{category}/14.mp3   (black -> white fallback)
 *  - /piece/sound/{category}/default.mp3
 *
 * For specials (castle/game-end) it returns the direct file first then default.
 */
function candidateUrls(category: string, pieceId?: number): string[] {
  const urls: string[] = [];

  if (pieceId !== undefined) {
    urls.push(`/piece/sound/${category}/${pieceId}.mp3`);
    // if black (odd) try white (even) as a fallback
    if (pieceId % 2 === 1) {
      urls.push(`/piece/sound/${category}/${pieceId - 1}.mp3`);
    }
  }

  if (category === 'castle' || category === 'game-end') {
    urls.push(`/piece/sound/${category}.mp3`);
  } else {
    urls.push(`/piece/sound/${category}/default.mp3`);
  }

  return urls;
}

/**
 * Preload a single URL. Promise resolves on successful load, rejects on error.
 * Caches the promise so concurrent attempts reuse the same in-flight operation.
 */
function preloadUrl(url: string): Promise<void> {
  if (!isBrowser) return Promise.reject(new Error('Not running in browser'));
  if (loadedSounds[url]) return Promise.resolve();
  if (preloadUrlPromises[url]) {
    return preloadUrlPromises[url]!; // safe, we know
  }

  const p = new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    audio.preload = 'auto';

    const onSuccess = () => {
      cleanup();
      loadedSounds[url] = audio;
      resolve();
    };
    const onError = () => {
      cleanup();
      // so we don't keep a broken audio reference
      delete loadedSounds[url];
      reject(new Error('Failed to load ' + url));
    };
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onSuccess);
      audio.removeEventListener('loadedmetadata', onSuccess);
      audio.removeEventListener('error', onError);
    };

    // some browsers fire loadedmetadata earlier than canplaythrough — accept either
    audio.addEventListener('canplaythrough', onSuccess, { once: true });
    audio.addEventListener('loadedmetadata', onSuccess, { once: true });
    audio.addEventListener('error', onError, { once: true });

    // Start loading
    // If resource 404s, error event will be fired and promise rejects
    try {
      audio.load();
    } catch (e) {
      // In case creating/loading audio throws synchronously (very rare)
      cleanup();
      reject(e as Error);
    }
  });

  // If it fails, allow retry later by clearing the promise entry
  preloadUrlPromises[url] = p;
  p.catch(() => {
    delete preloadUrlPromises[url];
  });
  return p;
}

/**
 * Try each candidate URL in order, return the first successful URL or null.
 */
async function findFirstWorkingUrl(candidates: string[]): Promise<string | null> {
  for (const url of candidates) {
    try {
      await preloadUrl(url);
      return url;
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * Preload the appropriate sound for one (category, pieceId) pair and cache the resolved URL.
 */
async function preloadCategoryForPiece(category: string, pieceId?: number) {
  if (!isBrowser) return;
  const key = pieceId !== undefined ? `${category}-${pieceId}` : category;
  // don't try again if already resolved
  if (resolvedSoundMap[key]) return;

  const candidates = candidateUrls(category, pieceId);
  const url = await findFirstWorkingUrl(candidates);
  if (url) {
    resolvedSoundMap[key] = url;
  }
}

/**
 * Preload sounds for a piece ID (fires off the preload attempts, returns immediately)
 */
export function preloadPieceSounds(pieceId: number) {
  if (!isBrowser) return;

  for (const category of SOUND_CATEGORIES) {
    preloadCategoryForPiece(category, pieceId).catch(() => {});
  }

  // ensure special sounds are queued
  for (const special of OTHER_SOUNDS) {
    preloadCategoryForPiece(special).catch(() => {});
  }
}

/**
 * Preload helpers for castle & game-end
 */
let specialsQueued = false;
export function preloadSpecials() {
  if (!isBrowser) return;
  if (specialsQueued) return;
  specialsQueued = true;
  for (const s of OTHER_SOUNDS) {
    preloadCategoryForPiece(s).catch(() => {});
  }
}

/**
 * Play a sound given category and (optional) pieceId.
 */
export function playSound(category: string, pieceId?: number) {
  if (!isBrowser) return;

  const key = pieceId !== undefined ? `${category}-${pieceId}` : category;
  let url = resolvedSoundMap[key];

  // fallback to white's resolved mapping if black's not present
  if (!url && pieceId !== undefined && pieceId % 2 === 1) {
    const whiteKey = `${category}-${pieceId - 1}`;
    url = resolvedSoundMap[whiteKey];
  }

  // check loaded sounds if no sounds
  if (!url) {
    const candidates = candidateUrls(category, pieceId);
    for (const c of candidates) {
      if (loadedSounds[c]) {
        url = c;
        break;
      }
    }
  }

  if (url && loadedSounds[url]) {
    try {
      const clone = loadedSounds[url].cloneNode(true) as HTMLAudioElement;
      // browsers require a gesture to play sounds
      clone.play().catch(() => {
        return; // swallow
      });
    } catch {
      return; // don't care
    }
    return;
  }

  // last resort to find working candidate
  (async () => {
    try {
      const candidates = candidateUrls(category, pieceId);
      const found = await findFirstWorkingUrl(candidates);
      if (found && loadedSounds[found]) {
        resolvedSoundMap[key] = found;
        try {
          (loadedSounds[found].cloneNode(true) as HTMLAudioElement).play().catch(() => {});
        } catch {
          return; // don't care
        }
      }
    } catch {
      return; // don't care
    }
  })();
}

/**
 * Play move sounds based on move flags
 */
export function playMoveSound(move: number) {
  const pieceId = getMovePiece(move);
  const capture = !!getMoveCapture(move);
  const promoted = !!getMovePromoted(move);
  const castle = !!getMoveCastle(move);

  if (castle) {
    playSound('castle');
    return;
  }

  if (promoted) {
    playSound('promote', pieceId);
    return;
  }

  if (capture) {
    playSound('capture', pieceId);
    return;
  }

  playSound('move-self', pieceId);
}

/** Play game-end sound */
export function playGameEndSound() {
  playSound('game-end');
}

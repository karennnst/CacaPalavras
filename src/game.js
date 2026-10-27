import { ACCEPTED_GUESSES, ANSWERS, DICTIONARY_VERSION, normalizeWord } from "./dictionary.js";

export const MAX_GUESSES = 6;
export const SCHEMA_VERSION = 2;

export function createEmptyProgress() {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: 0,
    seenAnswerIds: [],
    roundCounter: 0,
    activeRound: null,
    difficultyPreference: "normal",
    stats: {
      gamesPlayed: 0,
      wins: 0,
      currentStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0]
    }
  };
}

export function validateProgress(value) {
  if (!value || value.schemaVersion !== SCHEMA_VERSION || !Array.isArray(value.seenAnswerIds)) {
    throw new Error("Os dados salvos não têm um formato compatível.");
  }
  if (!Number.isInteger(value.revision) || value.revision < 0) {
    throw new Error("A versão dos dados salvos não é válida.");
  }
  if (!value.seenAnswerIds.every((id) => typeof id === "string") ||
      !value.stats ||
      !Number.isInteger(value.stats.gamesPlayed) ||
      !Number.isInteger(value.stats.wins) ||
      !Number.isInteger(value.stats.currentStreak) ||
      !Array.isArray(value.stats.distribution) ||
      value.stats.distribution.length !== MAX_GUESSES ||
      !value.stats.distribution.every((count) => Number.isInteger(count) && count >= 0)) {
    throw new Error("As estatísticas salvas estão incompletas.");
  }
  if (!["normal", "hard"].includes(value.difficultyPreference)) {
    throw new Error("A dificuldade salva não é válida.");
  }
  if (value.activeRound && !isValidRound(value.activeRound)) {
    throw new Error("A rodada salva está incompleta.");
  }
  return value;
}

export function migrateProgress(value) {
  if (value?.schemaVersion === 1) {
    return validateProgress({ ...value, schemaVersion: SCHEMA_VERSION, revision: value.revision ?? 0 });
  }
  return validateProgress(value);
}

function isValidRound(round) {
  return Boolean(
    round &&
    typeof round.id === "string" &&
    typeof round.targetId === "string" &&
    typeof round.targetDisplay === "string" &&
    normalizeWord(round.targetDisplay).length === 5 &&
    round.targetNormalized === normalizeWord(round.targetDisplay) &&
    ["normal", "hard"].includes(round.difficulty) &&
    ["playing", "won", "lost"].includes(round.status) &&
    Array.isArray(round.guesses) &&
    round.guesses.length <= MAX_GUESSES &&
    round.guesses.every((guess) =>
      guess &&
      typeof guess.display === "string" &&
      normalizeWord(guess.display).length === 5 &&
      guess.normalized === normalizeWord(guess.display) &&
      Array.isArray(guess.marks) &&
      guess.marks.length === 5 &&
      guess.marks.every((mark) => ["exact", "present", "absent"].includes(mark))
    ) &&
    typeof round.currentInput === "string"
  );
}

export function scoreGuess(guess, target) {
  const normalizedGuess = Array.from(normalizeWord(guess));
  const normalizedTarget = Array.from(normalizeWord(target));
  if (normalizedGuess.length !== 5 || normalizedTarget.length !== 5) {
    throw new Error("A tentativa e a resposta precisam ter cinco letras.");
  }

  const marks = Array(5).fill("absent");
  const remaining = new Map();
  for (let index = 0; index < 5; index += 1) {
    if (normalizedGuess[index] === normalizedTarget[index]) {
      marks[index] = "exact";
    } else {
      remaining.set(normalizedTarget[index], (remaining.get(normalizedTarget[index]) ?? 0) + 1);
    }
  }
  for (let index = 0; index < 5; index += 1) {
    if (marks[index] === "exact") continue;
    const count = remaining.get(normalizedGuess[index]) ?? 0;
    if (count > 0) {
      marks[index] = "present";
      remaining.set(normalizedGuess[index], count - 1);
    }
  }
  return marks;
}

export function validateGuess(value, progress) {
  const display = value.trim().toLocaleUpperCase("pt-BR");
  const normalized = normalizeWord(display);
  if (Array.from(normalized).length !== 5 || !/^[A-Z]{5}$/u.test(normalized)) {
    return { ok: false, reason: "length", message: "A palavra precisa ter cinco letras." };
  }
  if (!ACCEPTED_GUESSES.has(normalized)) {
    return {
      ok: false,
      reason: "dictionary",
      message: "Essa palavra não está no vocabulário. Tente outra; nenhuma chance foi usada."
    };
  }
  if (progress.activeRound.difficulty === "hard") {
    const error = getHardModeError(display, progress.activeRound);
    if (error) return { ok: false, reason: "hard-mode", message: error };
  }
  return { ok: true, display, normalized };
}

export function getHardModeError(guess, round) {
  const normalizedGuess = Array.from(normalizeWord(guess));
  const fixed = new Map();
  const minimum = new Map();
  const maximum = new Map();

  for (const previous of round.guesses) {
    const letters = Array.from(previous.normalized);
    const positiveCounts = new Map();
    const totalCounts = new Map();
    previous.marks.forEach((mark, index) => {
      const letter = letters[index];
      totalCounts.set(letter, (totalCounts.get(letter) ?? 0) + 1);
      if (mark === "exact") fixed.set(index, letter);
      if (mark === "exact" || mark === "present") {
        positiveCounts.set(letter, (positiveCounts.get(letter) ?? 0) + 1);
      }
    });
    for (const [letter, count] of positiveCounts) {
      minimum.set(letter, Math.max(minimum.get(letter) ?? 0, count));
    }
    for (const [letter, count] of totalCounts) {
      if (positiveCounts.get(letter) !== count) {
        maximum.set(letter, Math.min(maximum.get(letter) ?? Infinity, positiveCounts.get(letter) ?? 0));
      }
    }
  }

  for (const [index, letter] of fixed) {
    if (normalizedGuess[index] !== letter) {
      return `No modo difícil, mantenha ${letter} na posição ${index + 1}.`;
    }
  }
  const guessCounts = new Map();
  normalizedGuess.forEach((letter) => guessCounts.set(letter, (guessCounts.get(letter) ?? 0) + 1));
  for (const [letter, count] of minimum) {
    if ((guessCounts.get(letter) ?? 0) < count) {
      return `No modo difícil, inclua ${letter} pelo menos ${count} vez${count === 1 ? "" : "es"}.`;
    }
  }
  for (const [letter, count] of maximum) {
    if ((guessCounts.get(letter) ?? 0) > count) {
      return `No modo difícil, use no máximo ${count} ocorrência${count === 1 ? "" : "s"} de ${letter}.`;
    }
  }
  return "";
}

function selectRandomIndex(length) {
  if (!globalThis.crypto?.getRandomValues) return Math.floor(Math.random() * length);
  const max = 0x1_0000_0000;
  const limit = max - (max % length);
  const value = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % length;
}

export function createRound(progress, difficulty = progress.difficultyPreference, random) {
  const seen = new Set(progress.seenAnswerIds);
  const available = ANSWERS.filter(({ id }) => !seen.has(id));
  if (available.length === 0) return { progress, exhausted: true };
  const index = random
    ? Math.min(available.length - 1, Math.floor(random() * available.length))
    : selectRandomIndex(available.length);
  const answer = available[index];
  const now = new Date().toISOString();
  const round = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    targetId: answer.id,
    targetDisplay: answer.display,
    targetNormalized: normalizeWord(answer.display),
    difficulty,
    status: "playing",
    guesses: [],
    currentInput: "",
    dictionaryVersion: DICTIONARY_VERSION,
    startedAt: now,
    completedAt: null
  };
  return {
    exhausted: false,
    progress: {
      ...progress,
      seenAnswerIds: [...progress.seenAnswerIds, answer.id],
      roundCounter: progress.roundCounter + 1,
      activeRound: round
    }
  };
}

export function submitGuess(progress, value) {
  const round = progress.activeRound;
  if (!round || round.status !== "playing") {
    return { ok: false, reason: "finished", message: "Esta rodada já terminou." };
  }
  const validation = validateGuess(value, progress);
  if (!validation.ok) return validation;

  const marks = scoreGuess(validation.display, round.targetDisplay);
  const guess = {
    display: validation.display,
    normalized: validation.normalized,
    marks,
    submittedAt: new Date().toISOString()
  };
  const guesses = [...round.guesses, guess];
  const won = validation.normalized === round.targetNormalized;
  const lost = !won && guesses.length === MAX_GUESSES;
  const status = won ? "won" : lost ? "lost" : "playing";
  const nextRound = { ...round, guesses, currentInput: "", status, completedAt: status === "playing" ? null : new Date().toISOString() };
  let nextProgress = { ...progress, activeRound: nextRound };

  if (status !== "playing") {
    const stats = { ...progress.stats, gamesPlayed: progress.stats.gamesPlayed + 1 };
    if (won) {
      stats.wins += 1;
      stats.currentStreak += 1;
      stats.distribution = [...stats.distribution];
      stats.distribution[guesses.length - 1] += 1;
    } else {
      stats.currentStreak = 0;
    }
    nextProgress = { ...nextProgress, stats };
  }
  return { ok: true, guess, progress: nextProgress, status };
}

export function makeShareText(round, roundCounter) {
  if (!round || round.status === "playing") throw new Error("O resultado só pode ser compartilhado após a rodada.");
  const outcome = round.status === "won" ? `${round.guesses.length}/6` : "X/6";
  const rows = round.guesses
    .map(({ marks }) => marks.map((mark) => ({ exact: "🟩", present: "🟨", absent: "⬜" })[mark]).join(""))
    .join("\n");
  return `Entre Letras ${roundCounter} ${outcome}\n\n${rows}`;
}

export function getKeyboardStates(round) {
  const priority = { absent: 1, present: 2, exact: 3 };
  const states = {};
  for (const guess of round?.guesses ?? []) {
    Array.from(guess.normalized).forEach((letter, index) => {
      const mark = guess.marks[index];
      if (!states[letter] || priority[mark] > priority[states[letter]]) states[letter] = mark;
    });
  }
  return states;
}

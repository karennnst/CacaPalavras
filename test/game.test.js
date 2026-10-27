import test from "node:test";
import assert from "node:assert/strict";
import {
  createEmptyProgress,
  createRound,
  getHardModeError,
  getKeyboardStates,
  migrateProgress,
  makeShareText,
  scoreGuess,
  submitGuess,
  validateProgress
} from "../src/game.js";
import { ANSWERS, normalizeWord } from "../src/dictionary.js";

function round(target, difficulty = "normal", guesses = []) {
  return {
    id: "round",
    targetId: normalizeWord(target),
    targetDisplay: target,
    targetNormalized: normalizeWord(target),
    difficulty,
    status: "playing",
    guesses,
    currentInput: "",
    dictionaryVersion: "test",
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: null
  };
}

test("normaliza acentos e cedilha para comparação", () => {
  assert.equal(normalizeWord("maçãS"), "MACAS");
  assert.deepEqual(scoreGuess("LAPIS", "LÁPIS"), ["exact", "exact", "exact", "exact", "exact"]);
});

test("pontua letras repetidas priorizando acertos exatos", () => {
  assert.deepEqual(scoreGuess("ARARA", "ABRIR"), ["exact", "present", "absent", "present", "absent"]);
  assert.deepEqual(scoreGuess("AAAAA", "AABCD"), ["exact", "exact", "absent", "absent", "absent"]);
});

test("escolhe palavra ainda não vista e sinaliza esgotamento", () => {
  const progress = createEmptyProgress();
  const first = createRound(progress, "normal", () => 0);
  assert.equal(first.exhausted, false);
  assert.equal(first.progress.seenAnswerIds.length, 1);
  assert.equal(first.progress.activeRound.difficulty, "normal");
  const exhausted = createRound(
    { ...progress, seenAnswerIds: ANSWERS.map(({ id }) => id) },
    "normal"
  );
  assert.equal(exhausted.exhausted, true);
});

test("tentativas inválidas não consomem chances e tentativa válida avança o jogo", () => {
  const progress = { ...createEmptyProgress(), activeRound: round("LIVRO") };
  const short = submitGuess(progress, "sol");
  assert.equal(short.ok, false);
  assert.equal(progress.activeRound.guesses.length, 0);
  const unknown = submitGuess(progress, "ZZZZZ");
  assert.equal(unknown.ok, false);
  assert.equal(progress.activeRound.guesses.length, 0);
  const accepted = submitGuess(progress, "MUNDO");
  assert.equal(accepted.ok, true);
  assert.equal(accepted.progress.activeRound.guesses.length, 1);
  assert.equal(accepted.progress.stats.gamesPlayed, 0);
});

test("vitória atualiza estatísticas uma única vez e texto compartilhado não revela resposta", () => {
  const progress = { ...createEmptyProgress(), activeRound: round("LIVRO") };
  const result = submitGuess(progress, "livro");
  assert.equal(result.status, "won");
  assert.equal(result.progress.stats.gamesPlayed, 1);
  assert.equal(result.progress.stats.wins, 1);
  assert.equal(result.progress.stats.distribution[0], 1);
  const share = makeShareText(result.progress.activeRound, 1);
  assert.match(share, /1\/6/u);
  assert.doesNotMatch(share, /LIVRO/u);
});

test("modo difícil exige letras reveladas em posição correta", () => {
  const firstGuess = {
    display: "LARGO",
    normalized: "LARGO",
    marks: scoreGuess("LARGO", "LIVRO"),
    submittedAt: "2026-01-01T00:00:00.000Z"
  };
  const activeRound = round("LIVRO", "hard", [firstGuess]);
  assert.match(getHardModeError("MANGA", activeRound), /posição 1/u);
  assert.equal(getHardModeError("LÍRIO", activeRound), "");
  assert.equal(getHardModeError("LIVRO", activeRound), "");
});

test("rejeita estrutura de rodada persistida incompleta", () => {
  const progress = createEmptyProgress();
  progress.activeRound = round("LIVRO");
  progress.activeRound.guesses = [{}];
  assert.throws(() => validateProgress(progress), /rodada salva está incompleta/u);
});

test("migra dados persistidos da versão anterior sem apagar estatísticas", () => {
  const oldProgress = createEmptyProgress();
  oldProgress.schemaVersion = 1;
  oldProgress.stats = { gamesPlayed: 3, wins: 2, currentStreak: 1, distribution: [1, 1, 0, 0, 0, 0] };
  const migrated = migrateProgress(oldProgress);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.revision, 0);
  assert.equal(migrated.stats.gamesPlayed, 3);
});

test("teclado mantém a melhor pista conhecida", () => {
  const guesses = [{
    normalized: "MUNDO",
    marks: ["absent", "present", "exact", "absent", "absent"]
  }];
  const states = getKeyboardStates({ guesses });
  assert.equal(states.M, "absent");
  assert.equal(states.U, "present");
  assert.equal(states.N, "exact");
});

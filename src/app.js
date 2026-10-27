import {
  createEmptyProgress,
  createRound,
  getKeyboardStates,
  makeShareText,
  MAX_GUESSES,
  submitGuess
} from "./game.js";
import { normalizeWord } from "./dictionary.js";
import { loadProgress, saveProgress } from "./storage.js";
import "./styles.css";

const $ = (selector) => document.querySelector(selector);
const elements = {
  board: $("#board"),
  keypad: $("#keypad"),
  status: $("#status"),
  submit: $("#submit-btn"),
  erase: $("#erase-btn"),
  newRound: $("#new-round-btn"),
  shareArea: $("#share-area"),
  shareButton: $("#share-btn"),
  shareText: $("#share-text"),
  shareLabel: $("#share-label"),
  modeDescription: $("#mode-description")
};

let progress = createEmptyProgress();
let selectedDifficulty = "normal";
let storageAvailable = true;
let blockedByConflict = false;
let isComposing = false;
let persistQueue = Promise.resolve();
let persistedRevision = 0;
let inputSaveTimer;

function setStatus(message, type = "") {
  elements.status.textContent = message;
  elements.status.className = `status${type ? ` ${type}` : ""}`;
}

function persist() {
  if (!storageAvailable) return;
  clearTimeout(inputSaveTimer);
  const snapshot = structuredClone(progress);
  persistQueue = persistQueue
    .then(async () => {
      persistedRevision = await saveProgress(snapshot, persistedRevision);
      progress = { ...progress, revision: persistedRevision };
    })
    .catch((error) => {
      storageAvailable = false;
      $("#storage-label").textContent = "progresso não salvo";
      $("#storage-label").classList.add("storage-warning");
      if (error.name === "ConflictError") {
        blockedByConflict = true;
        renderBoard();
        setStatus(`${error.message} Recarregue a página para continuar com os dados mais recentes.`, "error");
      } else {
        setStatus(`O progresso continua nesta sessão, mas não pôde ser salvo: ${error.message}`, "error");
      }
    });
}

function persistInputSoon() {
  if (!storageAvailable || blockedByConflict) return;
  clearTimeout(inputSaveTimer);
  inputSaveTimer = setTimeout(persist, 250);
}

function displayLetter(raw, index) {
  return Array.from(raw)[index] ?? "";
}

function renderBoard() {
  const round = progress.activeRound;
  const guesses = round?.guesses ?? [];
  const currentLetters = Array.from(round?.currentInput ?? "");
  elements.board.replaceChildren();

  for (let rowIndex = 0; rowIndex < MAX_GUESSES; rowIndex += 1) {
    const guess = guesses[rowIndex];
    const row = document.createElement("div");
    row.className = "guess-row";
    row.setAttribute("role", "row");
    row.setAttribute("aria-label", `Tentativa ${rowIndex + 1}`);
    const rowNumber = document.createElement("span");
    rowNumber.className = "row-num";
    rowNumber.setAttribute("aria-hidden", "true");
    rowNumber.textContent = String(rowIndex + 1).padStart(2, "0");
    row.append(rowNumber);

    for (let column = 0; column < 5; column += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("role", "cell");
      if (guess) {
        const letter = displayLetter(guess.display, column);
        const mark = guess.marks[column];
        const symbol = { exact: "✓", present: "↗", absent: "×" }[mark];
        const description = { exact: "no lugar certo", present: "na palavra, em outro lugar", absent: "não aparece" }[mark];
        tile.classList.add(mark);
        tile.setAttribute("aria-label", `${letter}, ${description}`);
        tile.append(document.createTextNode(letter));
        const marker = document.createElement("span");
        marker.className = "mark";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = symbol;
        tile.append(marker);
      } else {
        const isActiveRow = round?.status === "playing" && rowIndex === guesses.length;
        const letter = isActiveRow ? currentLetters[column] ?? "" : "";
        if (letter) tile.classList.add("filled");
        if (isActiveRow) tile.classList.add("current");
        tile.textContent = letter;
        tile.setAttribute("aria-label", letter ? `Letra ${letter}` : `Espaço ${column + 1} vazio`);
      }
      row.append(tile);
    }
    elements.board.append(row);
  }

  const isPlaying = round?.status === "playing";
  const canInteract = isPlaying && !blockedByConflict;
  $("#attempt-number").textContent = String(guesses.length);
  $("#progress-label").textContent = !round
    ? "Nenhuma palavra inédita disponível"
    : round.status !== "playing"
      ? "Trilha concluída"
      : guesses.length
        ? `${MAX_GUESSES - guesses.length} tentativas restantes`
        : "Sua primeira pista começa aqui";
  $("#progress-fill").style.width = `${(guesses.length / MAX_GUESSES) * 100}%`;
  elements.submit.disabled = !canInteract;
  elements.erase.disabled = !canInteract;
  elements.newRound.disabled = isPlaying || !round || blockedByConflict;
  elements.shareArea.hidden = isPlaying || !round;
  $("#game-heading").textContent = round?.status === "won"
    ? "Palavra descoberta"
    : round?.status === "lost"
      ? "Fim desta trilha"
      : "Sua trilha de letras";
  renderKeyboard();
}

function renderKeyboard() {
  const states = getKeyboardStates(progress.activeRound);
  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  elements.keypad.replaceChildren();
  rows.forEach((letters, rowIndex) => {
    const row = document.createElement("div");
    row.className = "key-row";
    if (rowIndex === 2) row.append(createKey("⌫", "wide", "Apagar uma letra", eraseLetter));
    for (const letter of letters) {
      row.append(createKey(letter, states[letter] ?? "", `Digitar ${letter}`, () => addLetter(letter)));
    }
    if (rowIndex === 2) row.append(createKey("Enviar", "wide", "Enviar tentativa", handleSubmit));
    elements.keypad.append(row);
  });
}

function createKey(label, state, accessibleName, action) {
  const button = document.createElement("button");
  button.type = "button";
  const classes = ["key"];
  if (["⌫", "Enviar"].includes(label)) classes.push("wide");
  if (["exact", "present", "absent"].includes(state)) classes.push(state);
  button.className = classes.join(" ");
  button.textContent = label;
  button.setAttribute("aria-label", accessibleName);
  button.disabled = progress.activeRound?.status !== "playing" || blockedByConflict;
  button.addEventListener("click", action);
  return button;
}

function addLetter(value) {
  const round = progress.activeRound;
  if (blockedByConflict || !round || round.status !== "playing" || Array.from(normalizeWord(round.currentInput)).length >= 5) return;
  const next = { ...round, currentInput: `${round.currentInput}${value}` };
  progress = { ...progress, activeRound: next };
  renderBoard();
  persistInputSoon();
}

function eraseLetter() {
  const round = progress.activeRound;
  if (blockedByConflict || !round || round.status !== "playing") return;
  const currentInput = Array.from(round.currentInput).slice(0, -1).join("");
  progress = { ...progress, activeRound: { ...round, currentInput } };
  renderBoard();
  persistInputSoon();
}

function handleSubmit() {
  const result = submitGuess(progress, progress.activeRound?.currentInput ?? "");
  if (!result.ok) {
    setStatus(result.message, "error");
    if (result.reason === "length") {
      elements.board.querySelectorAll(".tile.current").forEach((tile) => {
        tile.classList.add("bounce");
        setTimeout(() => tile.classList.remove("bounce"), 350);
      });
    }
    return;
  }

  progress = result.progress;
  renderBoard();
  renderStats();
  persist();
  if (result.status === "won") {
    setStatus(`Você encontrou ${progress.activeRound.targetDisplay}! Uma boa leitura das pistas.`, "success");
    elements.newRound.focus();
  } else if (result.status === "lost") {
    setStatus(`A trilha terminou. A palavra era ${progress.activeRound.targetDisplay}. Agora tem uma nova à espera.`, "error");
    elements.newRound.focus();
  } else {
    const exact = result.guess.marks.filter((mark) => mark === "exact").length;
    const present = result.guess.marks.filter((mark) => mark === "present").length;
    const absent = 5 - exact - present;
    const positionNames = ["1ª", "2ª", "3ª", "4ª", "5ª"];
    const markNames = { exact: "no lugar certo", present: "na palavra, em outro lugar", absent: "não aparece" };
    const details = result.guess.marks.map((mark, index) =>
      `${positionNames[index]} letra ${Array.from(result.guess.display)[index]}, ${markNames[mark]}`
    );
    setStatus(
      `Pista ${progress.activeRound.guesses.length}: ${exact} ${exact === 1 ? "letra no lugar certo" : "letras no lugar certo"}, ${present} ${present === 1 ? "em outro lugar" : "em outros lugares"} e ${absent} ausentes. ${details.join("; ")}.`
    );
  }
}

function renderStats() {
  const stats = progress.stats;
  $("#games-stat").textContent = String(stats.gamesPlayed);
  $("#wins-stat").textContent = String(stats.wins);
  $("#streak-stat").textContent = String(stats.currentStreak);
  const max = Math.max(1, ...stats.distribution);
  const bars = $("#history-bars");
  bars.replaceChildren();
  stats.distribution.forEach((value, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "bar-wrap";
    wrapper.setAttribute("aria-label", `${index + 1} tentativas: ${value} vitória${value === 1 ? "" : "s"}`);
    const count = document.createElement("span");
    count.textContent = value ? String(value) : "";
    const bar = document.createElement("span");
    bar.className = "bar";
    bar.style.height = `${Math.max(3, (value / max) * 26)}px`;
    wrapper.append(count, bar);
    bars.append(wrapper);
  });
}

function renderDifficulty() {
  $("#normal-btn").setAttribute("aria-pressed", String(selectedDifficulty === "normal"));
  $("#hard-btn").setAttribute("aria-pressed", String(selectedDifficulty === "hard"));
  elements.modeDescription.textContent = selectedDifficulty === "hard"
    ? "Difícil: mantenha as letras confirmadas e use todas as pistas na próxima rodada."
    : "Normal: use as pistas no seu tempo. A escolha vale para a próxima rodada.";
}

function startNextRound() {
  if (blockedByConflict) return;
  const result = createRound(progress, selectedDifficulty);
  if (result.exhausted) {
    progress = { ...progress, activeRound: null };
    persist();
    renderBoard();
    renderStats();
    setStatus("Você já encontrou todas as palavras disponíveis. Aguardamos uma atualização do banco.", "error");
    return;
  }
  progress = result.progress;
  elements.shareText.value = "";
  elements.shareText.hidden = true;
  elements.shareLabel.hidden = true;
  persist();
  renderBoard();
  renderDifficulty();
  $("#round-label").innerHTML = `RODADA <span>${String(progress.roundCounter).padStart(2, "0")}</span> <span aria-hidden="true">·</span> livre`;
  setStatus("Digite uma palavra de cinco letras para começar.");
}

function renderShareFallback(text) {
  elements.shareText.value = text;
  elements.shareText.hidden = false;
  elements.shareLabel.hidden = false;
  elements.shareText.focus();
  elements.shareText.select();
}

async function shareResult() {
  const text = makeShareText(progress.activeRound, progress.roundCounter);
  if (!navigator.clipboard?.writeText) {
    renderShareFallback(text);
    setStatus("A cópia automática não está disponível. O resultado está selecionado para copiar.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Resultado copiado. A palavra não foi incluída.", "success");
  } catch {
    renderShareFallback(text);
    setStatus("Não foi possível copiar automaticamente. O resultado está selecionado para copiar.", "error");
  }
}

function selectDifficulty(value) {
  if (blockedByConflict) return;
  selectedDifficulty = value;
  progress = { ...progress, difficultyPreference: value };
  renderDifficulty();
  persist();
}

function onPhysicalKey(event) {
  if (isComposing || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
  const tag = event.target?.tagName?.toLowerCase();
  if (blockedByConflict || progress.activeRound?.status !== "playing") return;
  if (["input", "textarea", "select"].includes(tag) || event.target?.isContentEditable) return;
  if (event.key === "Enter") {
    if (["button", "a"].includes(tag)) return;
    event.preventDefault();
    handleSubmit();
  } else if (event.key === "Backspace") {
    if (["button", "a"].includes(tag)) return;
    event.preventDefault();
    eraseLetter();
  } else if (Array.from(event.key).length === 1 && /^[\p{L}]$/u.test(event.key)) {
    event.preventDefault();
    addLetter(event.key.toLocaleUpperCase("pt-BR"));
  }
}

async function initialize() {
  try {
    progress = await loadProgress();
    selectedDifficulty = progress.difficultyPreference;
    persistedRevision = progress.revision;
    $("#storage-label").textContent = "sem cadastro · neste dispositivo";
  } catch (error) {
    storageAvailable = false;
    progress = createEmptyProgress();
    $("#storage-label").textContent = "sessão temporária";
    $("#storage-label").classList.add("storage-warning");
    setStatus(`Não foi possível ler o progresso salvo: ${error.message} Esta sessão não será persistida.`, "error");
  }

  if (!progress.activeRound) {
    const next = createRound(progress, selectedDifficulty);
    if (next.exhausted) {
      progress = next.progress;
      setStatus("Você já encontrou todas as palavras disponíveis. Aguardamos uma atualização do banco.", "error");
    } else {
      progress = next.progress;
      persist();
    }
  }
  renderDifficulty();
  renderBoard();
  renderStats();
  if (progress.activeRound) {
    $("#round-label").innerHTML = `RODADA <span>${String(progress.roundCounter).padStart(2, "0")}</span> <span aria-hidden="true">·</span> livre`;
    if (!elements.status.textContent.startsWith("Não foi possível")) setStatus("Digite uma palavra de cinco letras para começar.");
  }
}

elements.submit.addEventListener("click", handleSubmit);
elements.erase.addEventListener("click", eraseLetter);
elements.newRound.addEventListener("click", startNextRound);
elements.shareButton.addEventListener("click", shareResult);
$("#help-btn").addEventListener("click", () => $("#help-dialog").showModal());
$("#help-close").addEventListener("click", () => $("#help-dialog").close());
$("#normal-btn").addEventListener("click", () => selectDifficulty("normal"));
$("#hard-btn").addEventListener("click", () => selectDifficulty("hard"));
document.addEventListener("keydown", onPhysicalKey);
document.addEventListener("compositionstart", () => { isComposing = true; });
document.addEventListener("compositionend", () => { isComposing = false; });

initialize();

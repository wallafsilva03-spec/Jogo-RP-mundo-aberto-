/* ============================================================
   chooseJob.js — Escolha da Profissão  [ETAPA 3]  · tema Ghibli
   Cards grandes com emoji, nome, dificuldade e renda. Ao clicar,
   mostra a descrição completa e o botão "Começar". Salva a
   profissão e segue para o mundo (Etapa 4).
   ============================================================ */

import { SCREENS, JOBS } from "./config.js";
import { GameState } from "./state.js";
import { el, screens, toast, ghibliSky } from "./ui.js";

const DIFF_LABEL = { 1: "Fácil", 2: "Média", 3: "Difícil" };

export function ChooseJobScreen() {
  let selectedId = GameState.data.job || null;

  const cards = new Map();

  /* -------- painel de detalhe -------- */
  const detailEmoji = el("div.job-detail__emoji", {}, "🧭");
  const detailName = el("h2.job-detail__name", {}, "Selecione uma profissão");
  const detailDesc = el("p.job-detail__desc", {}, "Clique em um card para ver os detalhes e começar sua jornada.");
  const detailMeta = el("div.job-detail__meta", {});
  const startBtn = el(
    "button.btn.btn--primary.job-detail__start.is-disabled",
    { disabled: true, onClick: onStart },
    el("span.btn__label", {}, "Começar"),
    el("span.btn__arrow", {}, "›")
  );

  function metaChip(label, value, mod = "") {
    return el(
      `div.chip${mod}`,
      {},
      el("span.chip__label", {}, label),
      el("span.chip__value", {}, value)
    );
  }

  function difficultyDots(level) {
    const wrap = el("div.dots", {});
    for (let i = 1; i <= 3; i++) {
      wrap.append(el(`span.dot${i <= level ? ".on" : ""}`));
    }
    return wrap;
  }

  function renderDetail(job) {
    detailEmoji.textContent = job.emoji;
    detailName.textContent = job.name;
    detailDesc.textContent = job.desc;
    detailMeta.replaceChildren(
      (() => {
        const c = metaChip("Dificuldade", DIFF_LABEL[job.difficulty] || "—");
        c.append(difficultyDots(job.difficulty));
        return c;
      })(),
      metaChip("Renda média", job.income, ".chip--income")
    );
    startBtn.disabled = false;
    startBtn.classList.remove("is-disabled");
    startBtn.querySelector(".btn__label").textContent = `Começar como ${job.name}`;
  }

  function select(id) {
    selectedId = id;
    cards.forEach((card, cid) => card.classList.toggle("active", cid === id));
    const job = JOBS.find((j) => j.id === id);
    if (job) renderDetail(job);
    // rola o detalhe para a vista em telas pequenas
    detailName.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }

  function onStart() {
    if (!selectedId) return;
    const job = JOBS.find((j) => j.id === selectedId);
    GameState.setJob(selectedId);
    toast(`Boa sorte na sua carreira como ${job.name}! ${job.emoji}`);
    if (screens.has(SCREENS.WORLD)) {
      screens.show(SCREENS.WORLD);
    } else {
      toast("O mundo 3D chega na Etapa 4 🚧", 3200);
    }
  }

  /* -------- card de profissão -------- */
  function jobCard(job) {
    const card = el(
      "button.job-card",
      { onClick: () => select(job.id) },
      el("div.job-card__art", {}, el("span.job-card__emoji", {}, job.emoji)),
      el(
        "div.job-card__body",
        {},
        el("h3.job-card__name", {}, job.name),
        el(
          "div.job-card__foot",
          {},
          el("div.job-card__diff", {}, el("small", {}, DIFF_LABEL[job.difficulty]), difficultyDots(job.difficulty)),
          el("div.job-card__income", {}, job.income)
        )
      ),
      el("div.job-card__check", {}, "✓")
    );
    cards.set(job.id, card);
    return card;
  }

  return {
    mount() {
      const grid = el("div.job__grid", {}, ...JOBS.map(jobCard));

      const detail = el(
        "aside.job-detail",
        {},
        el("div.job-detail__head", {}, detailEmoji, el("div", {}, detailName, detailMeta)),
        detailDesc,
        startBtn
      );

      const content = el(
        "div.job",
        {},
        el(
          "header.job__head",
          {},
          el("button.cc__back", { onClick: () => screens.show(SCREENS.CREATE_CHARACTER) }, "‹ Voltar"),
          el("h1.job__title", {}, "Escolha sua Profissão"),
          el("p.job__sub", {}, `E aí, ${GameState.data.character?.name || "viajante"}? Por onde vamos começar a ganhar a vida?`)
        ),
        el("div.job__layout", {}, grid, detail)
      );

      // restaura seleção anterior, se houver
      if (selectedId) queueMicrotask(() => select(selectedId));

      return el("div.screen--center.theme-ghibli", {}, ghibliSky(), content);
    },
  };
}

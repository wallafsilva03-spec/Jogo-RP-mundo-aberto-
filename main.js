/* ============================================================
   main.js — Ponto de entrada / bootstrap do jogo
   • Inicializa a cena 3D de fundo (Three.js)
   • Cria o estado global do jogo (economia, personagem)
   • Registra e exibe as telas via ScreenManager
   Etapa 1: apenas o MENU INICIAL.
   ============================================================ */

import { GAME, SCREENS } from "./config.js";
import { Storage } from "./storage.js";
import { bus, el, screens, toast, openModal } from "./ui.js";
import { GameState } from "./state.js";
import { CharacterCreateScreen } from "./characterCreate.js";
import { ChooseJobScreen } from "./chooseJob.js";
import { WorldScreen } from "./world.js";
// scene.js (Three.js) é carregado sob demanda no boot() para que uma
// eventual falha de rede no CDN nunca bloqueie a interface do menu.

// exposto para depuração no console
window.BrasilOnline = { GameState, bus, GAME };

/* ============================================================
   TELA: MENU INICIAL
   ============================================================ */
function MenuScreen() {
  const hasSave = Storage.hasSave();

  const makeBtn = (icon, label, { primary = false, onClick } = {}) =>
    el(
      `button.btn${primary ? ".btn--primary" : ""}`,
      { onClick },
      el("span.btn__icon", {}, icon),
      el("span.btn__label", {}, label),
      el("span.btn__arrow", {}, "›")
    );

  return {
    mount() {
      const playLabel = hasSave ? "Continuar" : "Jogar";

      const actions = el(
        "div.menu__actions",
        {},
        makeBtn("▶", playLabel, {
          primary: true,
          onClick: () => onPlay(hasSave),
        }),
        hasSave &&
          makeBtn("✨", "Novo Jogo", {
            onClick: () => onNewGame(),
          }),
        makeBtn("⚙", "Configurações", { onClick: openSettings }),
        makeBtn("♥", "Créditos", { onClick: openCredits })
      );

      const menu = el(
        "section.menu",
        {},
        // topo
        el(
          "header.menu__top",
          {},
          el(
            "div.brandmark",
            {},
            el("span.brandmark__dot"),
            el("span", {}, "BRASIL ONLINE")
          ),
          el(
            "div.menu__status",
            {},
            el("span.hide-sm", {}, "Servidor de demonstração"),
            el("span", {}, el("b", {}, "● ONLINE"))
          )
        ),

        // centro (logo + ações)
        el(
          "div.menu__center",
          {},
          el(
            "div.logo",
            {},
            el("span.logo__kicker", {}, "MMORPG • Mundo Aberto"),
            el(
              "h1.logo__title",
              {},
              "BRASIL",
              el("span.accent", {}, "ONLINE")
            ),
            el(
              "p.logo__sub",
              {},
              "Escolha sua profissão, ganhe a vida nas ruas e construa sua história no maior mundo aberto brasileiro."
            )
          ),
          actions
        ),

        // rodapé
        el(
          "footer.menu__bottom",
          {},
          el(
            "div.menu__hints",
            {},
            el("span", {}, el("span.kbd", {}, "W"), el("span.kbd", {}, "A"),
              el("span.kbd", {}, "S"), el("span.kbd", {}, "D"), " mover"),
            el("span", {}, el("span.kbd", {}, "Mouse"), " câmera")
          ),
          el("div", {}, `v${GAME.version} · ${GAME.build}`)
        )
      );

      // wrapper de tela (recebe a classe .screen do ScreenManager)
      return el("div", {}, menu);
    },
  };
}

/* ---------------- Ações do menu ---------------- */

function onPlay(hasSave) {
  if (hasSave) {
    GameState.load();
    const d = GameState.data;
    if (d.character?.name) toast(`Bem-vindo de volta, ${d.character.name}!`);
    // retoma de onde parou
    if (d.character?.name && d.job) return screens.show(SCREENS.WORLD);
    if (d.character?.name) return screens.show(SCREENS.CHOOSE_JOB);
  }
  screens.show(SCREENS.CREATE_CHARACTER);
}

function onNewGame() {
  GameState.reset();
  toast("Iniciando nova jornada…");
  screens.show(SCREENS.CREATE_CHARACTER);
}

/* ---------------- Modal: Configurações ---------------- */
function openSettings() {
  const s = GameState.settings;

  const toggle = (key, label, sub) => {
    const t = el(`div.toggle${s[key] ? ".on" : ""}`);
    t.addEventListener("click", () => {
      s[key] = !s[key];
      t.classList.toggle("on", s[key]);
      Storage.writeSettings(s);
    });
    return el(
      "div.setting",
      {},
      el("div.setting__label", {}, label, sub ? el("small", {}, sub) : null),
      t
    );
  };

  const slider = (key, label) => {
    const input = el("input.slider", {
      type: "range", min: "0", max: "100", value: String(s[key]),
    });
    input.addEventListener("input", () => {
      s[key] = Number(input.value);
      Storage.writeSettings(s);
    });
    return el(
      "div.setting",
      {},
      el("div.setting__label", {}, label),
      input
    );
  };

  const resetBtn = el(
    "button.btn",
    {
      style: "margin-top:20px;justify-content:center;",
      onClick: () => {
        GameState.reset();
        toast("Progresso apagado.");
      },
    },
    el("span.btn__label", { style: "text-align:center;flex:0" }, "Apagar progresso salvo")
  );

  openModal({
    title: "Configurações",
    subtitle: "Ajustes salvos automaticamente neste navegador.",
    body: el(
      "div",
      {},
      slider("musicVolume", "Volume da música"),
      slider("sfxVolume", "Volume dos efeitos"),
      toggle("shadows", "Sombras", "Melhor visual, exige mais do computador"),
      toggle("highQuality", "Alta qualidade", "Renderização em resolução máxima"),
      resetBtn
    ),
  });
}

/* ---------------- Modal: Créditos ---------------- */
function openCredits() {
  const row = (role, name) =>
    el("div.credits__row", {}, el("span.credits__role", {}, role), el("span.credits__name", {}, name));

  openModal({
    title: "Créditos",
    subtitle: "Um protótipo feito com carinho para validar a experiência.",
    body: el(
      "div",
      {},
      row("Conceito & Game Design", "Brasil Online Studio"),
      row("Programação", "Equipe Frontend"),
      row("Engine 3D", "Three.js / WebGL"),
      row("Interface", "HTML5 · CSS3 · JavaScript"),
      el(
        "p.credits__foot",
        {},
        `${GAME.name} — versão ${GAME.version}`,
        el("br"),
        "MVP • protótipo 100% no navegador, sem servidor."
      )
    ),
  });
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
function boot() {
  // Registra as telas disponíveis
  screens.register(SCREENS.MENU, MenuScreen);
  screens.register(SCREENS.CREATE_CHARACTER, CharacterCreateScreen);
  screens.register(SCREENS.CHOOSE_JOB, ChooseJobScreen);
  screens.register(SCREENS.WORLD, WorldScreen);

  // Esconde a tela de boot e exibe o menu
  const bootEl = document.getElementById("boot");
  setTimeout(() => {
    bootEl.classList.add("hidden");
    screens.show(SCREENS.MENU);
  }, 900);

  // Cena 3D de fundo — carregada de forma isolada e assíncrona.
  // Se o Three.js (CDN) ou o WebGL falharem, o menu continua perfeito.
  initBackground();
}

async function initBackground() {
  const canvas = document.getElementById("bg-canvas");
  try {
    const { MenuScene } = await import("./scene.js");
    window.__menuScene = new MenuScene(canvas);
  } catch (e) {
    console.warn("[boot] Fundo 3D indisponível — seguindo com fundo estático.", e);
    // fallback: gradiente já aplicado via CSS (.ambient-overlay)
    canvas.style.display = "none";
  }
}

// Garante que o DOM esteja pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

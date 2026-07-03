/* ============================================================
   characterCreate.js — Tela de Criação de Personagem  [ETAPA 2]
   Escolha de: nome, sexo, cor da roupa e cor da pele, com preview
   3D ao vivo (CharacterPreview). Ao concluir, salva e segue para a
   escolha de profissão (Etapa 3).
   ============================================================ */

import { SCREENS, SKIN_TONES, OUTFIT_COLORS } from "./config.js";
import { GameState } from "./state.js";
import { bus, el, screens, toast } from "./ui.js";

export function CharacterCreateScreen() {
  let preview = null;

  // Estado local do formulário (parte do save existente, se houver)
  const existing = GameState.data.character || {};
  const form = {
    name: existing.name || "",
    sex: existing.sex || "m",
    skin: existing.skin || SKIN_TONES[2],
    outfit: existing.outfit || OUTFIT_COLORS[0],
  };

  /* -------- componentes de UI -------- */

  const nameInput = el("input.field__input", {
    type: "text",
    maxlength: "18",
    placeholder: "Ex.: João da Silva",
    value: form.name,
    autocomplete: "off",
    spellcheck: "false",
  });
  nameInput.addEventListener("input", () => {
    form.name = nameInput.value.replace(/\s{2,}/g, " ");
    validate();
  });

  const sexToggle = (() => {
    const opt = (value, label, icon) => {
      const b = el(
        `button.segmented__opt${form.sex === value ? ".active" : ""}`,
        { onClick: () => setSex(value) },
        el("span", {}, icon), el("span", {}, label)
      );
      b.dataset.value = value;
      return b;
    };
    return el(
      "div.segmented",
      {},
      opt("m", "Masculino", "♂"),
      opt("f", "Feminino", "♀")
    );
  })();

  function setSex(value) {
    if (form.sex === value) return;
    form.sex = value;
    sexToggle.querySelectorAll(".segmented__opt").forEach((b) =>
      b.classList.toggle("active", b.dataset.value === value)
    );
    // sexo muda a geometria → reconstrói o avatar
    preview?.setAppearance({ sex: form.sex, skin: form.skin, outfit: form.outfit });
  }

  const swatches = (colors, current, onPick) => {
    const wrap = el("div.swatches");
    colors.forEach((c) => {
      const s = el(`button.swatch${c === current() ? ".active" : ""}`, {
        style: `--c:${c}`,
        "aria-label": c,
        onClick: () => {
          onPick(c);
          wrap.querySelectorAll(".swatch").forEach((x) =>
            x.classList.toggle("active", x === s)
          );
        },
      });
      wrap.append(s);
    });
    return wrap;
  };

  const outfitSwatches = swatches(OUTFIT_COLORS, () => form.outfit, (c) => {
    form.outfit = c;
    preview?.applyColors({ outfit: c });
  });

  const skinSwatches = swatches(SKIN_TONES, () => form.skin, (c) => {
    form.skin = c;
    preview?.applyColors({ skin: c });
  });

  const continueBtn = el(
    "button.btn.btn--primary.cc__continue",
    { onClick: onContinue },
    el("span.btn__label", {}, "Continuar"),
    el("span.btn__arrow", {}, "›")
  );

  const hint = el("div.cc__hint", {}, "Digite um nome para continuar.");

  function validate() {
    const ok = form.name.trim().length >= 2;
    continueBtn.disabled = !ok;
    continueBtn.classList.toggle("is-disabled", !ok);
    hint.textContent = ok
      ? "Tudo pronto! Arraste o personagem para girar."
      : "Digite um nome com pelo menos 2 letras.";
    return ok;
  }

  function onContinue() {
    if (!validate()) {
      nameInput.focus();
      return;
    }
    GameState.setCharacter({
      name: form.name.trim(),
      sex: form.sex,
      skin: form.skin,
      outfit: form.outfit,
    });
    toast(`Personagem "${form.name.trim()}" criado! 🎉`);
    // Etapa 3: escolha de profissão (já preparado; ativado na próxima etapa)
    if (screens.has(SCREENS.CHOOSE_JOB)) {
      screens.show(SCREENS.CHOOSE_JOB);
    } else {
      toast("A escolha de profissão chega na Etapa 3 🚧", 3200);
    }
  }

  /* -------- montagem da tela -------- */

  return {
    mount() {
      const canvas = el("canvas.cc__canvas", { id: "cc-canvas" });

      const stage = el(
        "div.cc__stage",
        {},
        canvas,
        el("div.cc__badge", {}, "Pré-visualização"),
        el("div.cc__drag", {}, "⟲ arraste para girar")
      );

      const panel = el(
        "div.cc__panel",
        {},
        el("button.cc__back", { onClick: () => screens.show(SCREENS.MENU) }, "‹ Voltar"),
        el("h1.cc__title", {}, "Criar Personagem"),
        el("p.cc__sub", {}, "Dê vida ao seu personagem antes de escolher a profissão."),

        field("Nome", nameInput),
        field("Sexo", sexToggle),
        field("Cor da roupa", outfitSwatches),
        field("Cor da pele", skinSwatches),

        el("div.cc__foot", {}, hint, continueBtn)
      );

      const root = el("div.cc", {}, stage, panel);

      // Inicializa o preview 3D após a tela entrar no DOM
      queueMicrotask(async () => {
        try {
          const { CharacterPreview } = await import("./scene.js");
          preview = new CharacterPreview(canvas);
          preview.setAppearance({ sex: form.sex, skin: form.skin, outfit: form.outfit });
          // corrige tamanho depois da animação de entrada da tela
          setTimeout(() => preview?.resize(), 450);
        } catch (e) {
          console.warn("[characterCreate] preview 3D indisponível.", e);
          stage.classList.add("cc__stage--fallback");
          stage.prepend(el("div.cc__fallback", {}, "👤", el("small", {}, "Preview 3D indisponível")));
        }
      });

      validate();
      setTimeout(() => nameInput.focus(), 500);

      // wrapper de tela centralizado
      return el("div.screen--center", {}, root);
    },

    unmount() {
      preview?.dispose();
      preview = null;
    },
  };
}

/** helper: rótulo + controle */
function field(label, control) {
  return el("div.field", {}, el("label.field__label", {}, label), control);
}

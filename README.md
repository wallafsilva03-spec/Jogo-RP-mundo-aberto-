# 🇧🇷 Brasil Online

Protótipo **frontend** de um MMORPG de mundo aberto brasileiro. Roda 100% no
navegador — **sem backend, sem banco de dados**. Dados em memória + LocalStorage.

> Construído com HTML5, CSS3, JavaScript puro, Three.js e WebGL. Sem frameworks.

---

## ▶️ Como rodar

O projeto usa **ES Modules**, então precisa ser servido por HTTP (não abra o
`index.html` via `file://`).

```bash
# opção 1 — Python
python3 -m http.server 8080

# opção 2 — qualquer servidor estático
npx serve .
```

Depois acesse: <http://localhost:8080>

---

## 🧭 Roadmap por etapas

O desenvolvimento é incremental. Cada etapa só avança após aprovação.

| Etapa | Entrega | Status |
|------:|---------|:------:|
| **1** | Menu inicial (logo, Jogar, Configurações, Créditos) | ✅ **atual** |
| 2 | Criação de personagem (nome, sexo, cor de roupa/pele) | ⏳ |
| 3 | Escolha de profissão (cards, descrição, dificuldade, renda) | ⏳ |
| 4 | Mundo 3D + personagem + HUD + missões | ⏳ |

---

## 🏗️ Arquitetura

Estrutura modular pensada para crescer (multiplayer, login, economia online,
inventário, casas, empresas e comércio entre jogadores — tudo desligado no MVP
via `FEATURES` em `config.js`).

```
index.html      → shell da página, import map do Three.js
style.css       → design system (glassmorphism, animações, variáveis)
config.js       → constantes: telas, economia, profissões, feature flags
storage.js      → persistência (LocalStorage hoje, API amanhã)
ui.js           → EventBus, ScreenManager, toast, modal, helper de DOM
scene.js        → cena 3D de fundo do menu (Three.js)
main.js         → bootstrap, estado global e a tela do Menu (Etapa 1)
player.js       → personagem 3ª pessoa            [Etapa 4]
camera.js       → câmera orbital de 3ª pessoa      [Etapa 4]
hud.js          → HUD de jogo                      [Etapa 4]
missions.js     → motor de missões                 [Etapa 4]
assets/         → models, textures, sounds
```

### Princípios
- **Máquina de estados de telas** (`ScreenManager`) com transições suaves.
- **EventBus** para comunicação desacoplada entre módulos.
- **Camada de persistência** isolada — trocar LocalStorage por uma API não
  afeta o resto do código.
- **Feature flags** (`config.js`) para habilitar recursos online no futuro.

"""
============================================================
 BRASIL ONLINE — Servidor para Google Colab
============================================================
Sobe o protótipo (Etapa 1) e gera um LINK PÚBLICO para jogar
direto do navegador, sem instalar nada na sua máquina.

COMO USAR NO COLAB
------------------
1) Abra https://colab.research.google.com  ->  Novo notebook
2) Cole TODO este arquivo em UMA célula
3) Aperte ▶ (Executar)
4) Clique no link que aparecer ("Abrir jogo")

Não precisa de backend, banco de dados nem nada pago.
============================================================
"""

import os
import subprocess
import threading
import http.server
import socketserver
import functools

# ------------------------------------------------------------
# CONFIGURAÇÃO — ajuste apenas se mudar o repositório/branch
# ------------------------------------------------------------
REPO_URL = "https://github.com/wallafsilva03-spec/Jogo-RP-mundo-aberto-.git"
BRANCH   = "claude/brasil-online-mmorpg-ekazrg"
DEST     = "/content/brasil-online"
PORT     = 8000

# Se o repositório for PRIVADO, gere um token em
# https://github.com/settings/tokens (escopo: repo) e cole aqui.
# Ex.: GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxx"
GITHUB_TOKEN = ""


# ------------------------------------------------------------
# 1) Clonar (ou atualizar) o repositório na branch da Etapa 1
# ------------------------------------------------------------
def preparar_repositorio():
    url = REPO_URL
    if GITHUB_TOKEN:
        url = REPO_URL.replace("https://", f"https://{GITHUB_TOKEN}@")

    if os.path.isdir(os.path.join(DEST, ".git")):
        print("📁 Repositório já existe — atualizando...")
        subprocess.run(["git", "-C", DEST, "fetch", "origin", BRANCH], check=True)
        subprocess.run(["git", "-C", DEST, "checkout", BRANCH], check=True)
        subprocess.run(["git", "-C", DEST, "reset", "--hard", f"origin/{BRANCH}"], check=True)
    else:
        print("⬇️  Clonando o jogo...")
        subprocess.run(
            ["git", "clone", "--branch", BRANCH, "--single-branch", url, DEST],
            check=True,
        )
    print("✅ Arquivos prontos em:", DEST)


# ------------------------------------------------------------
# 2) Servidor HTTP estático (com headers para ES Modules/WebGL)
# ------------------------------------------------------------
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # evita cache agressivo durante os testes
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass  # silencia o log de cada requisição


def iniciar_servidor():
    handler = functools.partial(Handler, directory=DEST)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("0.0.0.0", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    print(f"🚀 Servidor rodando na porta {PORT}")
    return httpd


# ------------------------------------------------------------
# 3) Gerar o link público (proxy do próprio Colab)
# ------------------------------------------------------------
def mostrar_link():
    try:
        from google.colab.output import serve_kernel_port_as_window
        print("\n============================================")
        print("  ✅ BRASIL ONLINE PRONTO! Clique abaixo:")
        print("============================================\n")
        serve_kernel_port_as_window(PORT, path="/index.html")
    except Exception:
        # Fora do Colab (ex.: rodando localmente)
        print(f"\n▶ Abra no navegador: http://localhost:{PORT}/index.html\n")


# ------------------------------------------------------------
# Execução
# ------------------------------------------------------------
if __name__ == "__main__":
    preparar_repositorio()
    iniciar_servidor()
    mostrar_link()
    print("\n💡 Dica: o link abre em uma nova aba. Bom jogo!")
    print("   (Deixe esta célula em execução enquanto joga.)")

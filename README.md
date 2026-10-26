# Museu dos Projetos

Portfólio em 3D: um museu onde o visitante salta para dentro dos quadros para ver cada projeto.

**Site:** https://rafaelfsilva17.github.io/rafaelfsilva-portfolio/

## Acrescentar um projeto

1. No museu, carrega em **+ Projeto**, cola o link e carrega em **Preparar quadro**.
2. Abre o GitHub e carrega em **Create**.
3. Em cerca de 2 minutos a ação tira a print da página e o quadro aparece no museu.

Também funciona diretamente no GitHub: **Issues → New issue → Novo projeto**.
Ou em **Actions → Novo projeto → Run workflow**. Com o link vazio, tira de novo as prints de todos os projetos.

Só o dono do repositório consegue acrescentar quadros.

## Como funciona

- `index.html` contém o museu inteiro, em WebGL puro e sem dependências.
- `projetos.json` é a lista de projetos acrescentados pelo link.
- `capturas/` guarda as prints tiradas automaticamente.
- `scripts/capturar.mjs` abre o site num Chromium (Playwright), tira a print e atualiza a lista.
- `.github/workflows/novo-projeto.yml` corre o script quando abres um pedido "Novo projeto".

O museu cresce sozinho: cada par de projetos novos acrescenta mais uma secção ao salão.

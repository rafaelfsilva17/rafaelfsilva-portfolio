// Tira a print de um site e acrescenta (ou atualiza) o quadro em projetos.json.
// Entradas: ISSUE_BODY (formulário "Novo projeto") ou IN_LINK / IN_NOME (execução manual).
// Sem link: volta a tirar as prints de todos os projetos.
import { chromium } from 'playwright';
import fs from 'node:fs';

const FILE = 'projetos.json';
const DIR = 'capturas';

function campo(body, titulo) {
  const re = new RegExp(`###\\s*${titulo}\\s*\\n+([\\s\\S]*?)(?=\\n###|$)`, 'i');
  const v = (body.match(re)?.[1] || '').trim();
  return v === '_No response_' ? '' : v;
}

const body = process.env.ISSUE_BODY || '';
let link = (process.env.IN_LINK || campo(body, 'Link do site')).trim();
let nome = (process.env.IN_NOME || campo(body, 'Nome do projeto')).trim();
const descricao = campo(body, 'Descrição curta');

if (body && !link) {
  const m = body.match(/https?:\/\/\S+/);
  if (m) link = m[0];
}
if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;

const lista = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8') || '[]') : [];
fs.mkdirSync(DIR, { recursive: true });

const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'projeto';

let alvos;
if (link) {
  let url;
  try { url = new URL(link); } catch { console.error('Link inválido:', link); process.exit(1); }
  let item = lista.find((p) => p.link.replace(/\/$/, '') === url.href.replace(/\/$/, ''));
  if (!item) {
    let id = slugify(nome || url.hostname.replace(/^www\./, ''));
    while (lista.some((p) => p.id === id)) id += '-2';
    item = { id, nome: nome || '', link: url.href, descricao, imagem: `${DIR}/${id}.jpg`, data: '' };
    lista.push(item);
  } else {
    if (nome) item.nome = nome;
    if (descricao) item.descricao = descricao;
  }
  alvos = [item];
} else {
  alvos = lista;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 1600 },
  deviceScaleFactor: 1,
  locale: 'pt-PT',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
});

let falhas = 0;
for (const p of alvos) {
  const page = await ctx.newPage();
  try {
    try {
      await page.goto(p.link, { waitUntil: 'networkidle', timeout: 45000 });
    } catch {
      await page.goto(p.link, { waitUntil: 'domcontentloaded', timeout: 45000 });
    }
    await page.waitForTimeout(2500);
    if (!p.nome) p.nome = ((await page.title()) || new URL(p.link).hostname).trim().slice(0, 40);
    await page.screenshot({ path: p.imagem, type: 'jpeg', quality: 82 });
    p.data = new Date().toISOString();
    console.log('Print tirada:', p.nome, '→', p.imagem);
  } catch (e) {
    falhas++;
    console.error('Falhou:', p.link, e.message);
  } finally {
    await page.close();
  }
}
await browser.close();

if (link && falhas) process.exit(1);

fs.writeFileSync(FILE, JSON.stringify(lista, null, 2) + '\n');
const out = process.env.GITHUB_OUTPUT;
if (out) fs.appendFileSync(out, `nome=${(alvos[0]?.nome || '').replace(/\n/g, ' ')}\n`);

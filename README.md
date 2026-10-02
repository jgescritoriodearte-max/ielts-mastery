# IELTS Mastery

Aplicativo pessoal de preparação para o IELTS. Ele é **offline-first**, pode ser instalado como app (PWA) e tem **custo zero**: GitHub Pages + navegador + IndexedDB + Service Worker. O Claude é opcional e usado por copiar e colar.

> **IELTS Disclaimer.** O app não é afiliado ao IELTS, ao British Council, ao IDP nem à Cambridge University Press & Assessment, e não dá avaliação oficial. Toda nota exibida é uma *Estimated IELTS-style score — not an official IELTS score*. Todos os exercícios são **AI-generated IELTS-style practice**, escritos com o Claude para este app. Não são material oficial.

---

## Guia de publicação (para quem não é técnico)

**Passo 1. Criar uma conta grátis no GitHub**
Acesse github.com › Sign up. Não pede cartão.

**Passo 2. Criar um repositório público chamado `ielts-mastery`**
- Clique no **+** no canto superior direito › *New repository*.
- Em *Repository name*, digite `ielts-mastery`.
- Marque **Public**. O GitHub Pages grátis exige repositório público.
- Clique em *Create repository*.
- O repositório recebe só o código e os exercícios. **Seus dados de estudo nunca vão para lá.**

**Passo 3. Enviar todos os arquivos, incluindo `.github/workflows/`**
- Descompacte o `ielts-mastery.zip` no computador.
- No repositório, clique em *uploading an existing file* (ou *Add file › Upload files*).
- Abra a pasta descompactada `ielts-mastery`, selecione **tudo o que está dentro dela** e arraste para a página.
- Clique em *Commit changes*.
- **Importante:** confira se a pasta `.github` apareceu na lista do repositório. Ela é oculta em alguns computadores:
  - Windows: Explorador › *Exibir › Itens ocultos*.
  - Mac: tecla `Cmd + Shift + .`
- Se a pasta `.github` não subir, crie o arquivo à mão:
  1. *Add file › Create new file*.
  2. No nome, digite exatamente `.github/workflows/deploy.yml`.
  3. Cole o conteúdo do arquivo `deploy.yml` do zip.
  4. Clique em *Commit changes*.

**Passo 4. Abrir Settings › Pages**
No repositório, clique em *Settings* e depois, no menu à esquerda, em *Pages*.

**Passo 5. Selecionar GitHub Actions**
Em *Build and deployment › Source*, escolha **GitHub Actions**.

**Passo 6. Executar o workflow**
- Abra a aba *Actions*.
- Clique em **Build and deploy IELTS Mastery** › *Run workflow* › *Run workflow*.
- Espere aparecer o ✓ verde. Na primeira vez leva cerca de 5 a 15 minutos, porque os áudios são gerados.
- Clique na execução concluída. No resumo aparece se os áudios foram gerados ("Piper audio: N MP3 files") ou se o app vai usar a voz do aparelho.

**Passo 7. Abrir o endereço**
`https://SEU-USUARIO.github.io/ielts-mastery/` (troque SEU-USUARIO pelo seu nome de usuário do GitHub).

**Passo 8. Instalar como PWA**
- **Computador (Chrome ou Edge):** ícone de instalar na barra de endereço, ou *menu ⋮ › Instalar IELTS Mastery*.
- **Android (Chrome):** *menu ⋮ › Instalar app* (ou *Adicionar à tela inicial*).

**Passo 9. Abrir a Offline Library**
Menu lateral › *Offline Library*.

**Passo 10. Baixar os pacotes**
- Os 6 pacotes começam a baixar sozinhos. Confira se todos mostram **Downloaded ✓**.
- Se algum não mostrar, clique em *Download*.
- Confira se a seção **Offline readiness** está toda verde.

Pronto: a partir daqui o app funciona sem internet.

---

## Installation

Usuários finais não instalam nada além do PWA (passos 7 a 10). Para desenvolver, você precisa do Node.js 20+ (gratuito).

## Local Development

```bash
npm install            # instala react, react-dom, esbuild e typescript
npm run build          # gera a pasta dist/
npm run serve          # abre http://localhost:5173 (servidor estático local)
npm run typecheck      # verificação de tipos (TypeScript)
npm run audit          # audita os pacotes de conteúdo em dist/
```

Para testar exatamente como no GitHub Pages, sirva a pasta `dist` dentro de uma subpasta `ielts-mastery/`. O app só usa caminhos relativos, então funciona em qualquer subpasta.

## Build

- `build.mjs` faz quatro coisas:
  - empacota `src/` com o **esbuild**, gerando `assets/app.<hash>.js` e `.css`;
  - copia `public/` (manifest e ícones);
  - gera `dist/packs/*/pack.json` a partir de `content/`;
  - cria o `sw.js` com a versão e a lista de arquivos da casca do app.
- `node build.mjs --reindex` recalcula `packs/index.json` (tamanhos, versões e arquivos de áudio) depois que os áudios são gerados.
- `scripts/make_audio.py dist` gera os MP3 com o **Piper** (TTS neural gratuito e open-source). Precisa de `pip install "piper-tts>=1.2,<2"` e do `ffmpeg`.

## GitHub Pages Deployment

O workflow `.github/workflows/deploy.yml` roda em todo *push* na branch `main` ou quando você aciona manualmente. A ordem é:

1. `npm install` e `npm run build`.
2. Áudio com Piper. Este passo é **opcional e nunca bloqueia a publicação**: se falhar, o app é publicado assim mesmo e usa *Device Voice — Internet not required*.
3. `--reindex` e auditoria do conteúdo.
4. Resumo no log, informando quantos MP3 foram gerados.
5. Publicação no Pages.

O workflow não usa nenhum secret nem API key. Os modelos de voz são baixados gratuitamente do Hugging Face (rhasspy/piper-voices) e ficam em cache entre execuções.

## Offline Usage

**Funciona sem internet depois do primeiro acesso e do download dos pacotes:**
- Dashboard, plano, Reading, Listening (com áudio baixado), Grammar, Vocabulary com repetição espaçada;
- Writing (salvamento automático, checagens locais, autoavaliação);
- gravação de Speaking;
- Mock Test, timers, correção, notas, erros, gráficos, sequência de estudos, backup.

**Precisa de internet apenas para:**
- a primeira abertura;
- atualizar o app;
- baixar ou atualizar pacotes;
- a transcrição automática opcional no Speaking;
- usar o Claude.

**Quando sai uma versão nova do app**, aparece o botão **Update available · Reload**. A atualização troca apenas a casca do app. Progresso, redações, gravações, resultados, vocabulário e pacotes baixados são preservados.

## Installing as PWA

- **Chromium (Chrome/Edge) no computador e no Android:** testado, o app atende aos critérios de instalação do Chromium.
- **iPhone/iPad (Safari): não testado.** Pode funcionar via *Compartilhar › Adicionar à Tela de Início*, mas não há garantia.

## Downloading Offline Packs

Menu › **Offline Library**. Para cada pacote aparecem o tamanho, a quantidade de áudios e os botões **Download**, **Update** e **Remove**.

- *Clear downloaded content* apaga só os pacotes. Não apaga seu progresso.
- A seção **Offline readiness** mostra o que falta para usar o app 100% offline.
- **Android:** em *Configurações › Texto para fala*, instale uma voz em inglês offline. Ela é usada nos ditados e quando um áudio não existe.

## Backup & Restore

Menu › **Data & Backup**.

- **Export Backup:** gera `IELTS-Mastery-Backup-AAAA-MM-DD.json`. As gravações de voz entram de forma opcional.
- **Validate:** ao escolher um arquivo, o app confere 4 itens:
  - ✓ File valid
  - ✓ Schema compatible
  - ✓ Records found
  - ✓ No corruption detected (checksum)
- **Merge:** para cada registro, fica a versão mais recente (`updatedAt`). Nada é duplicado e itens que você apagou não voltam.
- **Replace:** exige digitar REPLACE. Antes, o app baixa uma cópia de segurança dos dados atuais. A troca é feita numa única transação: entra tudo ou nada muda.
- **Reset Data:** exige digitar DELETE. Os pacotes baixados continuam.

**Do computador para o celular:** exporte no computador, envie o arquivo (cabo, e-mail ou Drive) e importe no celular com **Merge**.

Faça backup toda semana. O app lembra você.

## Copy to Claude

Para Writing Feedback, Speaking Feedback, IELTS AI Tutor e Generate Practice, o fluxo é o mesmo:

1. O app monta um prompt estruturado (critérios IELTS e formato JSON exato da resposta).
2. Clique em **Copy prompt** e depois em **Open Claude**.
3. Cole o prompt no Claude.
4. Copie a resposta inteira do Claude.
5. Cole no app em **Import AI Feedback** (ou em *Import content*, no caso de pacotes).

O app valida a resposta e só importa se ela estiver correta. Se não estiver, mostra o que corrigir.

Nada disso é necessário para o app funcionar. Speaking nunca recebe nota de pronúncia, porque o Claude recebe apenas o texto.

## AI-generated Practice

Tudo neste app é **AI-generated IELTS-style practice**: os exercícios incluídos e os pacotes que você gerar e importar.

- Ao importar um pacote, o app exige JSON estruturado e confere tudo: tipos de questão válidos, respostas entre as opções, limites de palavras e evidência citada **exatamente** do texto.
- Pacotes inválidos não são importados.
- Pacotes importados ficam no aparelho e funcionam offline.
- Roteiros de Listening importados tocam com a voz do aparelho.

## Limitations

- **Pronúncia não é avaliada automaticamente.**
- **Os áudios usam vozes sintéticas** (Piper), não gravações reais de exame.
- **Notas de Listening/Reading** usam as tabelas de conversão publicadas mais comuns, que variam um pouco entre testes. Conjuntos curtos dão estimativas grosseiras.
- **Writing/Speaking sem o Claude** recebem apenas checagens por regras e a sua autoavaliação, não uma nota confiável.
- **O conteúdo incluído é limitado:**
  - 4 gravações e 3 textos de prática;
  - 1 simulado completo;
  - 15 tópicos de gramática;
  - 112 palavras;
  - temas de Writing e Speaking.
  
  Amplie com *Generate Practice* e com os testes Cambridge (registre as notas em *External Test Results*).
- **iPhone/Safari não foi testado.**
- **Se o navegador apagar os dados do site**, só um backup recupera.

## Privacy

**Your study data is stored locally on this device. Nothing is uploaded automatically.**

- Redações, gravações, progresso, resultados, vocabulário, erros e dados pessoais ficam no IndexedDB do navegador.
- O app só faz requisições ao próprio site (pacotes de conteúdo).
- O Claude é um serviço externo. O conteúdo só chega até ele se **você** colar lá.
- A transcrição ao vivo do Speaking é opcional e usa o serviço de voz do próprio navegador (no Chrome, o áudio vai para o Google). Ela só roda se você marcar essa opção.

## Adding Mock Test 02

1. Crie textos e roteiros com `mock:"02"` em `content/reading.mjs` e `content/listening.mjs`.
2. Adicione a entrada `mock-02` em `content/mocks.mjs`.
3. Rode o build. O núcleo do app não muda.

## Project structure

```
src/        React 19 + TypeScript (lib/, ui/, pages/)
content/    exercícios (fonte dos pacotes)
public/     manifest.webmanifest, ícones
scripts/    sw.template.js, make_audio.py, audit_content.mjs
build.mjs   build (esbuild) + pacotes + service worker
.github/workflows/deploy.yml
AUDIT.md    relatório de auditoria do release
```

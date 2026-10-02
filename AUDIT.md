# IELTS Mastery — Release audit (RC1, 01 Oct 2026)

**Escopo:** auditoria do `ielts-mastery.zip` existente, sem reconstruir nada. As alterações foram mínimas e nenhuma funcionalidade foi removida.

**Como foi testado:**
- Build local com o esbuild e o React 19.2.6.
- App servido em `http://127.0.0.1:5173/ielts-mastery/`, a mesma estrutura de subpasta do GitHub Pages.
- Testes automatizados no Chromium (Playwright) em 4 fases, com perfil persistente para simular fechar e reabrir o navegador.
- Desktop em 1366×768 e celular em 390×844.

## Checklist final

| Item | Resultado | Evidência |
|---|---|---|
| BUILD | ✓ (local) · `npm install` **NOT VERIFIED** | O esbuild gera o bundle (≈470 KB, inclui React) e o TypeScript compila sem erros. O `npm install` não pôde rodar aqui porque o registro do npm está bloqueado neste ambiente. As versões ficaram fixadas nas mesmas que testei. |
| GITHUB PAGES | ✓ simulado · real **NOT VERIFIED** | JS, CSS, ícones, manifest, `sw.js`, `packs/*.json` e os MP3 carregaram de `/ielts-mastery/`, sem nenhum HTTP 4xx/5xx. O código não tem nenhum caminho absoluto `/`. |
| PWA | ✓ (Chromium) | `Page.getInstallabilityErrors` retornou `[]` e o manifest não teve erros de leitura (CDP). O clique real em "Instalar" não pode ser testado em modo headless. |
| SERVICE WORKER | ✓ | O escopo foi `…/ielts-mastery/`. A navegação offline funcionou. Simulei uma nova publicação: o botão "Update available" apareceu, a casca antiga foi removida e o IndexedDB e os 6 pacotes ficaram intactos, em 2 rodadas. |
| OFFLINE | ✓ | Fiz o ciclo completo: abrir online → baixar os 6 pacotes → desligar a internet → fechar → reabrir → estudar todas as áreas → fechar → reabrir. Os dados continuaram idênticos. |
| INDEXEDDB | ✓ | As contagens por store ficaram iguais antes e depois de reiniciar o navegador e antes e depois da atualização. |
| BACKUP | ✓ | O export gerou o JSON com checksum e 10 gravações incluídas. Um arquivo adulterado foi rejeitado com "Checksum mismatch". |
| RESTORE | ✓ | Fiz Reset → Replace: todas as contagens voltaram, inclusive o feedback importado, a autoavaliação, o vocabulário, o simulado e as 10 gravações com áudio. A cópia de segurança foi baixada antes. |
| MERGE | ✓ | Importei o mesmo arquivo de novo: 0 adicionados, 0 duplicados, 269 mantidos. |
| LISTENING | ✓ | O MP3 tocou a partir do cache estando offline. Sem MP3, aparece o aviso "Device Voice — Internet not required". Correção, ortografia e limite de palavras funcionaram. |
| PIPER | **NOT VERIFIED** | Todo o caminho (WAV → MP3 → pacote → reindex → download → reprodução offline) foi testado com uma voz substituta. O Piper real e o download das vozes só rodam no GitHub Actions. |
| READING | ✓ | Correção, banda estimada, evidência destacada e estratégia por tipo de questão. |
| WRITING | ✓ | Salvamento automático, envio, checagens locais, autoavaliação, importação do Claude (JSON válido e inválido) e permanência como "enviada". |
| SPEAKING | ✓ (microfone simulado) | Gravou, salvou no IndexedDB, reproduziu, exportou e incluiu no backup. Com microfone e Android reais: **NOT VERIFIED**. |
| GRAMMAR | ✓ | Os exercícios foram corrigidos e as explicações e a acurácia por tópico foram salvas. |
| VOCABULARY | ✓ | Flashcards com repetição espaçada e quiz atualizaram o agendamento de revisão. |
| MOCK TEST | ✓ | As 4 partes rodaram offline em modo prova (navegação escondida, timers, envio automático) e o relatório foi gerado. |
| RESPONSIVE MOBILE | ✓ | Nenhuma das 16 telas teve rolagem horizontal em 390×844. O menu lateral (drawer) abre e navega. |
| PRIVACY | ✓ | Nas 4 fases de teste, **0 requisições** saíram para fora da origem do site. No código não há API key, token, senha nem URL privada. |
| ZERO-COST ARCHITECTURE | ✓ | GitHub Pages, Actions grátis em repositório público, IndexedDB, Service Worker e Cache API. Nenhum secret ou API paga. |

## Problemas encontrados nesta auditoria e corrigidos

1. **Rótulo incorreto do conteúdo.**
   - Problema: os exercícios incluídos estavam marcados como "Original IELTS-style practice", mas foram escritos pelo Claude.
   - Correção: agora são rotulados como **AI-generated IELTS-style practice** nos pacotes, na Offline Library, nos cards de Reading/Listening e nas telas de Grammar, Vocabulary, Writing e Speaking, e na seção About.
2. **Texto de privacidade incompleto.**
   - Correção: Settings ganhou a frase exata "Your study data is stored locally on this device. Nothing is uploaded automatically.", a explicação de que o Claude é externo, o aviso sobre a transcrição do navegador (que envia áudio ao Google no Chrome) e o aviso de que não há avaliação oficial. A frase também aparece em Data & Backup.
3. **Instalação do Piper podia derrubar o deploy.**
   - Problema: a instalação do Piper estava num passo separado, fora do fallback.
   - Correção: instalação e geração viraram **um passo opcional** (`continue-on-error`). O log agora mostra "Piper audio: N MP3 files…" ou "Piper audio NOT generated – Device Voice…", também no resumo da execução.
4. **Referência a MP3 inexistente.**
   - Problema: uma geração parcial podia deixar o pacote apontando para um MP3 que não existe.
   - Correção: o `--reindex` agora remove essas referências, e o app cai na voz do aparelho.
5. **Faltava auditoria automática de conteúdo.**
   - Correção: criei `scripts/audit_content.mjs`, que roda com `npm run audit` e como passo do CI.
   - Ele verifica: JSON válido, IDs únicos, resposta, explicação, evidência no texto, nível, categoria, respostas entre as opções, arquivos listados e MP3 existentes, e o rótulo.
   - Resultado: 14 conjuntos, 112 palavras e 15 tópicos de gramática, com **0 erros**.
6. **Descrição errada do pacote de gramática:** dizia 14 tópicos e 70 exercícios; o correto é 15 e 75.
7. **`make_audio.py` não sinalizava falha total.** Agora sai com erro e mensagem clara quando nenhum áudio é gerado, sem bloquear o deploy.
8. **README reescrito** com as seções pedidas e o guia de publicação em 10 passos.

Problemas corrigidos antes desta auditoria e confirmados de novo:
- rascunhos de Writing duplicados;
- envio de redação desfeito pelo salvamento automático;
- Reset apagando o registro dos pacotes;
- duplicação de questões no simulado;
- gráficos saindo da área.

## Não verificado neste ambiente: testar depois de publicar

| # | O que testar | Como |
|---|---|---|
| A | O site abre | Abrir `https://SEU-USUARIO.github.io/ielts-mastery/` |
| B | O PWA pode ser instalado | Chrome no PC: ícone de instalar na barra de endereço. Android: menu › Instalar app |
| C | Os assets carregam | A tela de onboarding aparece com ícones e estilo |
| D | O Service Worker registra | Offline Library › Offline readiness › "Offline engine active" ✓ |
| E | Os pacotes aparecem | Offline Library: 6 pacotes "Downloaded ✓" |
| F | Os áudios foram gerados | Aba Actions › execução › resumo "Piper audio: N MP3 files" (esperado ≈135) |
| G | Os áudios podem ser baixados | Offline Library mostra "N pre-produced audio files" em Listening/Mock/Writing & Speaking |
| H | O Listening funciona offline | Modo avião › abrir o app › Listening › Booking a Table › Play (selo "Pre-produced audio") |
| I | O progresso permanece | Fazer 1 exercício › fechar o app › reabrir offline › Dashboard › Exercises completed |
| J | O backup funciona | Data & Backup › Export Backup › Import do mesmo arquivo › Validate (4 ✓) › Merge |

Outros itens não verificados:
- `npm install` no GitHub Actions;
- download das vozes do Piper pelo Hugging Face;
- microfone real;
- vozes TTS reais do aparelho (o Chromium headless não tem nenhuma);
- aparelho Android físico;
- iPhone/Safari;
- comportamento de remoção de dados pelo navegador a longo prazo.

Se o item F falhar, o app continua utilizável. A causa aparece no log do passo "Generate pre-produced audio…".

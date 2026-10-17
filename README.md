# Site Rodrigo Lamin

Site oficial do Rodrigo Lamin e página do **ALTITUDE, Imersão dos Cultivadores**. É um site estático, só com HTML, CSS e JavaScript: não precisa de build, framework nem servidor próprio.

| Página | Arquivo |
|---|---|
| Início | `index.html` |
| ALTITUDE | `altitude/index.html` |

O restante (cores, tipografia, componentes, a animação da árvore, a conversa de contato, fontes e fotos) fica em `design-system/`.

## Publicar em 2 minutos

**Cloudflare Pages:** em Workers & Pages, escolha Create → Pages → Connect to Git e selecione este repositório. Deixe o *Build command* vazio e use `/` como *Build output directory*. Depois, em Custom domains, adicione `rodrigolamin.com.br`.

**Vercel ou Netlify:** importe o repositório com Framework "Other", sem comando de build e com a raiz como pasta de saída.

**Hospedagem comum (FTP):** envie todos os arquivos para a pasta pública do domínio, mantendo a estrutura de pastas.

Cada `git push` na branch `main` publica de novo sozinho no Cloudflare, na Vercel ou na Netlify.

## O que conferir antes de publicar

1. **Domínio.** O endereço canônico, as imagens de compartilhamento, o `sitemap.xml` e o `robots.txt` usam `https://rodrigolamin.com.br`. Se o domínio for outro, troque em todos os arquivos (busque por `rodrigolamin.com.br`).
2. **Medição.** As páginas já trazem o Google Analytics 4 (`G-54VT9MGHJH`) e o Meta Pixel (`1421057743489136`). Se essas contas não forem suas, troque os dois IDs no `<head>` de `index.html` e de `altitude/index.html`.
   - Eventos enviados: visita à página; `open_conversation` / `Contact` quando a pessoa abre a conversa; `generate_lead` / `Lead` quando ela vai para o WhatsApp.
   - No GA4, marque `generate_lead` como evento principal.
3. **WhatsApp.** Os botões levam para `wa.me/5548991469196`. Para trocar o número, busque `5548991469196` em `index.html`, `altitude/index.html` e `design-system/conversa.js`.
4. **Textos e números.** Revise a trajetória, as datas do ALTITUDE e o investimento antes de divulgar.

## Onde mexer

- **Textos:** direto no HTML de cada página.
- **Cores, fontes e espaçamentos:** `design-system/tokens.css`.
- **Botões, cartões e outros componentes:** `design-system/components.css`.
- **Perguntas da conversa de contato:** `design-system/conversa.js`.
- **Fotos:** `design-system/assets/fotos/`. Mantenha o mesmo nome do arquivo ou atualize o `src` no HTML.

## Já incluído

- Título, descrição, endereço canônico e imagem de compartilhamento (Open Graph) em cada página.
- Ícone da aba (araucária).
- `robots.txt` e `sitemap.xml`.
- Fotos em WebP ou JPG otimizado, com carregamento sob demanda e dimensões declaradas.
- Fontes locais, sem depender do Google Fonts.
- `_headers` com cache longo para fotos e fontes, aplicado no Cloudflare Pages e na Netlify.
- Medição de leads pelo WhatsApp.

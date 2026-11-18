# Arcanos Maiores

Mesa de tarot de Marselha para ler com calma. O site não prevê o futuro: ele nomeia a pergunta, abre as cartas e guarda o que se repetiu.

Versão atual: `0.1.0-beta.4.0`. Repositório: [lucvsrosendo/Arcana](https://github.com/lucvsrosendo/Arcana).

## O que o projeto é

Uma aplicação de página única, em português, inglês e espanhol, com os 22 Arcanos Maiores. A pessoa escolhe o formato da tiragem, puxa as cartas, pode perguntar ao oráculo e anotar no diário. Conta, notícias e painel de edição ficam no mesmo lugar, cada um com o papel que tem.

| Rota | Para quê |
| --- | --- |
| `/home` | Entrada: carta do dia, os 22 em movimento, formatos de tiragem |
| `/reading` | Tiragem: uma carta, três, Cruz Celta e os outros formatos |
| `/arcana` | Biblioteca dos 22, com busca e favoritos |
| `/learn` | Como ler cada posição, sem transformar o estudo num manual genérico |
| `/history` | Leituras já feitas |
| `/journal` | Diário ligado à tiragem |
| `/news/:id` | Notícia |
| `/settings` | Conta, tema, idioma e preferências da leitura |
| `/news-admin` | Painel do editor. Conta nova não entra aqui |

## Como foi feito

React 18, TypeScript e Vite. Estilo com Tailwind. Estado da leitura no Zustand. Login, dados e funções de borda no Supabase. O oráculo fala com a Groq só no servidor: o navegador chama `/api/chat` e `/api/interpret-card`, e a Vercel encaminha para as funções. O visual público usa Cormorant Garamond para o título e uma sans para o resto, no tom noturno de Marselha.

## O que este ciclo entregou

O site público passou a falar a mesma língua visual. Home, Aprender, Arcanos, Tiragem e Conta compartilham o hero editorial, a borda leve e o dourado só como acento. O trilho dos 22 na home corre em marquee e aproxima a carta no hover.

O painel de notícias saiu desse idioma de propósito. Título curto, abas de ferramenta, mesa de escrita em largura inteira e arquivo em lista. Quem edita não deve sentir que está numa página de leitura.

A segurança deixou de ser só header. Conta nova cai como usuário comum. Admin só existe se o `user_id` estiver em `site_news_admins`. As funções de chat limitam pedido por IP, recusam corpo inválido e não devolvem erro interno do provedor. Busca na web e o modo extra de modelo ficam desligados até alguém ligar no servidor. O envio de digest, se um dia for publicado, exige um segredo que não vai para o navegador.

## Desafios

O oráculo em produção não falhava no código da tela. As funções não estavam publicadas, depois faltava a chave da Groq, e em seguida os modelos Llama que a Groq tinha aposentado. A troca foi para `openai/gpt-oss-20b` e `openai/gpt-oss-120b`. No meio do caminho o CLI chegou a apontar para outro projeto Supabase. O certo é o projeto `tarot`.

No Windows, “reduzir animações” zerava o marquee: uma regra antiga matava qualquer animação do site. O trilho precisou de uma exceção, senão a faixa dos 22 ficava parada.

A tela de login do Google mostra `….supabase.co` porque o callback é do Supabase. Nome e logo se ajustam no Google Cloud. Trocar o domínio que aparece exige um domínio próprio no projeto, e isso é um add-on pago. Não se resolve só no botão do site.

A barra horizontal no rodapé de todas as páginas era rolagem, não um componente. O trilho das cartas é bem mais largo que a janela, e o link de pular conteúdo também passava da borda. Os dois juntos abriam a faixa em qualquer rota.

O painel de admin, no primeiro redesenho, ainda parecia uma página de leitura espremida. A mesa da notícia e o arquivo precisaram ser seções separadas, e o visual do painel teve de se afastar do resto do site.

## Resultado

As páginas de leitura compartilham uma superfície só. O painel de edição é uma ferramenta à parte. O oráculo responde em produção, com limite e sem vazar detalhe do provedor. Uma conta criada pelo site não vira admin. A rolagem horizontal saiu. O `main` no GitHub está neste estado.

Ainda depende de configuração, não de código: `ALLOWED_ORIGIN` com o domínio real, o próximo deploy do frontend na Vercel para o header novo de isolamento, e o Upstash se o limite de 20 pedidos por minuto precisar valer para o projeto inteiro, não só para uma instância.

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

O Vite sobe em `http://127.0.0.1:5173`. Se a porta estiver ocupada, encerre o processo antigo antes de subir de novo. Sem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o site abre e a conta fica desligada. Sem `GROQ_API_KEY` no servidor, o oráculo responde que não está configurado.

```bash
npm test
npm run build
```

Deploy, segredos e OAuth estão em [DEPLOY.md](DEPLOY.md). Não commite `.env.local`.

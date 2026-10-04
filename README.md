# Apuração 2026

App pessoal para acompanhar a apuração das Eleições 2026 em tempo real, com dados oficiais do TSE.

- Seletor de local (Brasil ou qualquer UF), cargo (Presidente, Governador, Senador, Deputados) e turno
- Foto, nome, partido, número, % e votos de cada candidato, com barras e números animados
- Mapa do Brasil (Presidente, Governador e Senador) pintado com a cor do partido que lidera em cada estado,
  com visão por região (soma dos votos dos estados por partido): `/?visao=mapa&cargo=1`
- Atualiza sozinho a cada 15 s (pausa quando a aba está em segundo plano)
- A seleção fica na URL, dá para salvar nos favoritos: `/?abr=CE&cargo=3`
- Modo simulação para testar antes das 17h (`/?simulacao=1`)
- Sem banco de dados: uma rota `/api/resultado` busca o JSON do TSE com cache de 10 s

## Rodar localmente

```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploy na Vercel (plano free)

1. Suba a pasta para um repositório no GitHub.
2. Na Vercel: Add New → Project → importe o repositório. Nada a configurar.

Ou, com a CLI: `npx vercel` dentro da pasta.

## Códigos do TSE

Ficam em `lib/config.ts` (eleição federal 6257/6258, estadual 6259/6260, ciclo `ele2026`).
Se o TSE publicar códigos diferentes no `ele-c.json`, troque ali ou use as variáveis
`TSE_ELEICAO_FEDERAL_T1`, `TSE_ELEICAO_ESTADUAL_T1` etc.

Mapa do Brasil: [SVG Maps](https://github.com/VictorCazanave/svg-maps), licença CC BY 4.0.

Projeto pessoal, sem vínculo com a Justiça Eleitoral.

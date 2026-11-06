# Clima em Chamas

Site acadêmico sobre clima e queimadas no Brasil. O projeto usa HTML, CSS e JavaScript, com gráficos do Chart.js.

## Como abrir

1. Extraia o arquivo ZIP.
2. Abra a pasta no VS Code.
3. Inicie o `index.html` com a extensão Live Server.
4. É necessário estar conectado à internet para carregar o Chart.js, consultar a Open-Meteo e carregar as fontes.

## O que funciona

- Consulta de temperatura histórica pela API pública Open-Meteo.
- Gráfico de linha com a média anual de temperatura.
- Importação de CSV do Programa Queimadas do INPE para montar os gráficos de focos por estado e por bioma.
- Filtro de localidade e período.
- Cadastro, consulta, edição, exclusão e busca de anotações.
- Layout adaptado para celular e computador.

## Arquivo do INPE

Na seção de análises, selecione um CSV que tenha uma coluna `estado` ou `UF`. Para preencher também o gráfico de biomas, o arquivo deve ter a coluna `bioma`. Se houver uma coluna `data`, o filtro por ano também será aplicado aos focos. O site conta as linhas do arquivo; use os dados originais do INPE e confira o período selecionado.

## Back4App

O formulário de anotações funciona no navegador usando o armazenamento local. Para usar o banco na nuvem:

1. Crie um app no Back4App.
2. Crie uma classe chamada `Anotacoes` com os campos `title`, `date`, `region`, `category` e `description` (todos do tipo String).
3. Abra `app.js` e preencha `appId` e `chave` no objeto `back4app`.
4. Mantenha as permissões da classe adequadas ao projeto. Não use chaves mestras no front-end.

Quando as chaves forem configuradas, o CRUD passa a usar a API REST do Back4App. Sem configuração, os registros ficam salvos apenas no navegador utilizado.

## Fontes

- Open-Meteo: https://open-meteo.com/
- INPE — Programa Queimadas: https://terrabrasilis.dpi.inpe.br/queimadas/portal/
- Chart.js: https://www.chartjs.org/
- Back4App: https://www.back4app.com/

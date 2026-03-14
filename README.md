# Gerador de Contratos

Um sistema web para criar e gerenciar contratos em PDF. A ideia é simples: você preenche as cláusulas, o sistema monta o documento com seus dados e gera o PDF pronto para assinar.

## O que dá pra fazer

- Gerar contratos em PDF (Prestação de Serviço, Locação, Empréstimo, Compra e Venda, Recibo e outros)
- Editar as cláusulas padrão ou adicionar novas
- Baixar e reimprimir contratos anteriores
- Filtrar contratos por data
- Cadastrar usuários com dois níveis de acesso: usuário comum e admin
- Troca de senha obrigatória no primeiro login

## Stack

Node.js, Express, Sequelize, SQLite, Handlebars, PDFKit

## Como rodar

```bash
git clone https://github.com/seu-usuario/gerador-de-contratos.git
cd gerador-de-contratos
npm install
mkdir sessions
node app.js
```

Abre em `http://localhost:3000`.

## Estrutura de pastas

```
├── public/
│   ├── css/
│   └── contratos/       ← PDFs gerados ficam aqui
├── sessions/            ← sessões persistentes
├── src/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── router/
│   └── views/
└── app.js
```

## Níveis de acesso

- **Usuário** — gera, lista e baixa contratos
- **Admin** — tudo acima, mais gerenciamento de usuários

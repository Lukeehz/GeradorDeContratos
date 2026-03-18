# Gerador de Contratos

Sistema web para criação e gerenciamento de contratos em PDF.
O usuário preenche os dados e cláusulas necessárias, e o sistema monta automaticamente o documento e gera um PDF pronto para download ou impressão.

---

## Funcionalidades

* Geração automática de contratos em PDF
* Suporte para diferentes tipos de contrato:

  * Prestação de Serviço
  * Locação
  * Empréstimo
  * Compra e Venda
  * Recibo
* Edição de cláusulas padrão
* Adição de novas cláusulas personalizadas
* Listagem de contratos gerados
* Download e reimpressão de contratos
* Filtro de contratos por data
* Sistema de usuários com dois níveis de acesso
* Troca de senha obrigatória no primeiro login

---

## Tecnologias Utilizadas

* Node.js
* Express
* Sequelize
* SQLite
* Handlebars
* PDFKit

---

## Instalação

Clone o repositório:

```bash
git clone https://github.com/seu-usuario/gerador-de-contratos.git
```

Entre na pasta do projeto:

```bash
cd gerador-de-contratos
```

Instale as dependências:

```bash
npm install
```

Crie a pasta de sessões:

```bash
mkdir sessions
```

Inicie a aplicação:

```bash
node app.js
```

A aplicação ficará disponível em:

```
http://localhost:3000
```

---

## Estrutura do Projeto

```
├── public/
│   ├── css/
│   └── contratos/        # PDFs gerados
│
├── sessions/             # Sessões persistentes
│
├── src/
│   ├── controllers/      # Lógica das rotas
│   ├── db/               # Configuração do banco
│   ├── middlewares/      # Middlewares da aplicação
│   ├── models/           # Models do Sequelize
│   ├── router/           # Rotas da aplicação
│   └── views/            # Templates Handlebars
│
└── app.js                # Arquivo principal da aplicação
```

---

## Níveis de Acesso

### Usuário

* Criar contratos
* Visualizar contratos gerados
* Baixar contratos em PDF

### Administrador

* Todas as permissões de usuário
* Gerenciamento de usuários do sistema

---

## Observações

* O banco de dados SQLite é criado automaticamente na primeira execução.
* Os arquivos PDF gerados são armazenados em `public/contratos/`.
* A pasta `sessions/` é utilizada para persistência de sessões do sistema.

---

## Licença

Este projeto está licenciado sob a licença **MIT**.

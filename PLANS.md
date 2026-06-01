# PLANS.md - Reconstrução do Projeto Super Ofertas

Este ExecPlan é um documento vivo. Ele deve ser mantido atualizado durante toda a execução do projeto.

## Purpose / Big Picture

Construir uma aplicação web SPA em React para catálogo de promoções de supermercado, com página pública para clientes e painel administrativo para cadastro, edição, ativação, desativação e remoção de promoções.

O sistema deve permitir que uma loja publique ofertas com imagem, preço promocional, preço original, categoria, descrição e botão de contato via WhatsApp. O painel administrativo deve permitir gerenciar promoções e configurações da loja.

O projeto deve funcionar em dois modos:

- `demo`: sem Supabase configurado, usando `localStorage`.
- `supabase`: usando Supabase Auth, Supabase Postgres e Supabase Storage.

O resultado esperado é uma aplicação funcional, responsiva, visualmente coerente e preparada para manutenção futura.

## Progress

- [x] Analisar auditoria técnica existente
- [x] Analisar documentação de design system existente
- [x] Criar estrutura inicial do projeto React + Vite
- [x] Configurar rotas com React Router DOM
- [x] Criar camada de dados para modo `demo`
- [x] Criar camada de dados para modo `supabase`
- [x] Criar dados iniciais de demonstração
- [x] Criar schema SQL do Supabase
- [x] Criar página pública do catálogo
- [x] Criar busca por nome
- [x] Criar filtro por categoria
- [x] Criar cards de promoção
- [x] Criar CTA de WhatsApp
- [x] Criar tela de login administrativo
- [x] Criar fluxo de logout
- [x] Criar proteção da rota `/admin`
- [x] Criar painel administrativo
- [x] Criar modal de criação/edição de promoção
- [x] Criar upload de imagem
- [x] Criar edição das configurações da loja
- [x] Criar fluxo de recuperação de senha
- [x] Criar fluxo de redefinição de senha
- [x] Aplicar design system
- [x] Melhorar acessibilidade dos modais
- [x] Criar confirmação de exclusão
- [x] Corrigir animação de loading
- [x] Padronizar estados `disabled`
- [ ] Validar responsividade
- [x] Criar README
- [x] Validar build final

## Surprises & Discoveries

- O projeto original concentra grande parte da lógica em `src/App.jsx`.
- Não existe backend próprio; o front-end conversa diretamente com Supabase SDK ou `localStorage`.
- O modo demo usa autenticação simulada no navegador.
- A tabela `store_settings` deve representar uma configuração única da loja, mas precisa de cuidado para evitar múltiplos registros.
- O design usa CSS global com tokens em `:root`, mas ainda precisa de tokens mais consistentes para spacing, radius e estados.
- Existe risco de UX na exclusão de promoções sem confirmação.
- Existe oportunidade de melhorar acessibilidade com trap de foco em modal e `focus-visible`.
- O repositório começou praticamente vazio, contendo apenas `PLANS.md`, `README.md` mínimo e `Prompt.md`, sem scaffold React ou `package.json`.
- `npm install` concluiu com sucesso, mas reportou 2 vulnerabilidades moderadas em dependências transitivas.
- `npm run preview` é um servidor de longa duração; a execução atingiu timeout no terminal da sessão enquanto servia localmente, o que impede usar esse comando como verificação conclusiva aqui.
- A ativação e desativação de promoções ficou mais clara com ação rápida direto na lista do painel, além do controle dentro do modal.
- A categoria `Frutas` foi adicionada ao catálogo e ao formulário para refletir melhor a organização esperada de promoções alimentares.

## Decision Log

- Decisão: usar React 18 + Vite.
  - Motivo: o projeto auditado foi identificado como SPA React com Vite.

- Decisão: usar React Router DOM 6.
  - Motivo: o projeto precisa de rotas `/`, `/login`, `/forgot-password`, `/reset-password`, `/admin`, `/register` e fallback.

- Decisão: manter CSS puro em `src/styles.css`.
  - Motivo: o design system original usa CSS global sem Tailwind config ou biblioteca de componentes.

- Decisão: manter dois modos de operação: `demo` e `supabase`.
  - Motivo: permite testar o sistema sem banco real e ativar produção com Supabase.

- Decisão: não criar backend Express.
  - Motivo: a arquitetura esperada usa Supabase diretamente no front-end.

- Decisão: usar Supabase Auth, Postgres e Storage.
  - Motivo: autenticação, banco e upload de imagens já fazem parte dos requisitos auditados.

- Decisão: adicionar melhorias além do projeto original.
  - Motivo: a auditoria encontrou problemas importantes: exclusão sem confirmação, animação incompleta, estado disabled sem padrão visual, validações fracas e acessibilidade parcial.

- Decisão: concentrar os componentes da SPA em `src/App.jsx` e deixar a persistência isolada em `src/lib/appBackend.js`.
  - Motivo: mantém a aplicação simples, funcional e próxima da organização esperada pela auditoria, evitando espalhar complexidade cedo demais.

- Decisão: usar imagens demo em SVG data URI.
  - Motivo: evita dependência de imagens externas para o funcionamento básico do catálogo e garante que o modo demo seja autossuficiente.

- Decisão: expor ação rápida de `Ativar`/`Desativar` na lista administrativa.
  - Motivo: reduz atrito no gerenciamento diário e deixa o status da promoção explícito no fluxo de cadastro e manutenção.

- Decisão: incluir a categoria `Frutas` além de `Hortifruti`.
  - Motivo: melhora a organização do catálogo para itens frutíferos e atende melhor o uso esperado no cadastro de promoções.

## Outcomes & Retrospective

- O que foi construído:
  - SPA React + Vite com rotas públicas e administrativas.
  - Catálogo público com busca, filtro por categoria, cards promocionais e CTA de WhatsApp.
  - Fluxos de login, logout, recuperação e redefinição de senha.
  - Painel admin com CRUD de promoções, upload de imagem, configurações da loja e confirmação de exclusão.
  - Camada `demo` com `localStorage` e camada `supabase` com Auth, Postgres e Storage.
  - Schema SQL completo para Supabase, design system em CSS puro e README operacional.

- O que ficou pendente:
  - Validação manual completa de responsividade e fluxos no navegador durante esta sessão.
  - Teste fim a fim com um projeto Supabase real configurado via `.env`.

- Quais decisões mudaram:
  - Mantida a simplicidade estrutural com componentes centralizados em `src/App.jsx` e backend abstraction separada.
  - O modo demo passou a usar imagens embutidas para não depender de assets externos.

- Quais problemas foram encontrados:
  - O repositório não tinha scaffold inicial do app.
  - O navegador embutido não ficou disponível como ferramenta nesta sessão para QA visual.
  - `npm run preview` não é adequado como verificação conclusiva neste terminal por ser processo persistente.

- Como rodar o projeto:
  - `npm install`
  - `npm run dev`
  - Opcionalmente configurar `.env` a partir de `.env.example` para usar Supabase.

- Como validar o projeto:
  - Executar `npm run build`
  - Revisar manualmente home, busca, categorias, CTA de WhatsApp, login, painel admin, CRUD, configurações, reset de senha e responsividade.

## Context and Orientation

O projeto é um catálogo de promoções para supermercado.

Existem dois tipos principais de usuário:

1. Cliente público
   - Acessa o catálogo
   - Busca promoções
   - Filtra por categoria
   - Visualiza imagem, nome, descrição e preço
   - Clica no botão de WhatsApp para entrar em contato

2. Administrador
   - Acessa `/login`
   - Entra no painel `/admin`
   - Cadastra promoções
   - Edita promoções
   - Remove promoções
   - Ativa ou desativa promoções
   - Edita nome da loja
   - Edita número de WhatsApp
   - Faz upload de imagem ou usa URL de imagem

Rotas esperadas:

| Rota | Função |
| --- | --- |
| `/` | Catálogo público |
| `/login` | Login administrativo |
| `/register` | Redirecionar para `/login` |
| `/forgot-password` | Solicitação de recuperação de senha |
| `/reset-password` | Redefinição de senha |
| `/admin` | Painel administrativo |
| `*` | Redirecionar para `/` |

Tecnologias obrigatórias:

- React 18
- Vite 5
- React Router DOM 6
- CSS puro em `src/styles.css`
- Supabase JavaScript SDK
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Google Fonts via CSS

Dependências esperadas:

```json
{
  "@supabase/supabase-js": "latest",
  "react": "latest",
  "react-dom": "latest",
  "react-router-dom": "latest"
}
```

## Design System Esperado

### Identidade Visual

A interface deve ser:

- Comercial
- Amigável
- Promocional
- Clara
- Leve
- Funcional
- Adequada para supermercado local

O destaque visual deve estar em:

- Promoções
- Preços
- Cards de produtos
- Busca
- Categorias
- Botão de WhatsApp
- Painel administrativo limpo

### Paleta de Cores

Usar tokens CSS em `:root`:

```css
:root {
  --background: hsl(30 20% 98%);
  --foreground: hsl(20 15% 10%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(20 15% 10%);

  --primary: hsl(24 95% 53%);
  --primary-foreground: hsl(0 0% 100%);

  --secondary: hsl(30 20% 94%);
  --muted: hsl(30 15% 93%);
  --muted-foreground: hsl(20 10% 45%);

  --accent: hsl(142 70% 45%);
  --destructive: hsl(0 84.2% 60.2%);
  --border: hsl(30 15% 88%);

  --radius: 16px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;

  --shadow: 0 14px 32px rgba(17, 12, 8, 0.08);
  --shadow-hover: 0 18px 38px rgba(17, 12, 8, 0.14);

  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --container-max: 1280px;
}
```

### Tipografia

Usar Google Fonts:

- Títulos: `"Poppins", sans-serif`
- Corpo: `"Inter", sans-serif`

Importar em `src/styles.css`:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap");
```

### Layout

Container global:

```css
.container {
  width: min(100% - 32px, 1280px);
  margin: 0 auto;
}
```

Breakpoints esperados:

- Mobile: 1 coluna
- `min-width: 640px`: 2 colunas
- `min-width: 1024px`: 3 colunas
- `min-width: 1280px`: 4 colunas
- `max-width: 767px`: ajustes mobile para admin, formulários e botões

### Componentes Visuais

Criar e estilizar:

- Hero público com gradiente laranja
- Header público com marca, badge de ambiente e link/admin
- Campo de busca no hero
- Barra de categorias em formato pill
- Grid de cards de promoção
- Card de produto com imagem, badge de desconto, categoria, nome, descrição, preço e WhatsApp
- Footer público
- Tela de login
- Tela de recuperação de senha
- Tela de redefinição de senha
- Painel admin
- Header admin sticky
- Lista admin de promoções
- Modal de promoção
- Modal de configurações da loja
- Mensagens inline de erro, sucesso e informação
- Loading screen
- Empty states
- Restricted state

### Melhorias Obrigatórias de Design/UX

Implementar além do projeto original:

- Estado visual para botões `disabled`
- `@keyframes spin` para loading
- Confirmação antes de excluir promoção
- `aria-label` no botão de fechar modal
- `focus-visible` padronizado
- Trap de foco simples em modais, se possível
- Retorno de foco ao elemento que abriu o modal, se possível
- Mensagens claras em operações administrativas
- Acesso admin mais compreensível sem prejudicar o público

## Plan of Work

### Fase 1 - Estrutura Inicial

Criar projeto Vite + React.

Arquivos esperados:

```txt
index.html
package.json
vite.config.js
.env.example
README.md
src/
  main.jsx
  App.jsx
  styles.css
  data.js
  lib/
    appBackend.js
supabase/
  schema.sql
```

Não criar backend próprio.

Não criar Tailwind se ele não for necessário.

Não criar biblioteca de componentes externa.

### Fase 2 - Dados Demo

Criar `src/data.js` com:

- `DEFAULT_STORE`
- `CATEGORIES`
- `DEMO_PROMOTIONS`
- `DEMO_ADMIN`

Categorias sugeridas:

```js
["Todos", "Hortifruti", "Açougue", "Bebidas", "Mercearia", "Limpeza", "Padaria", "Frios"]
```

Promoção deve ter:

```js
{
  id: "string",
  name: "string",
  category: "string",
  description: "string",
  price: number,
  originalPrice: number,
  image: "string",
  active: boolean
}
```

Configuração da loja:

```js
{
  storeName: "Super Ofertas",
  whatsappNumber: "5565999999999"
}
```

Credencial demo:

```js
{
  email: "admin@demo.com",
  password: "123456"
}
```

Atenção: deixar claro no README que credencial demo não é segurança real.

### Fase 3 - Camada de Backend

Criar `src/lib/appBackend.js`.

Responsabilidades:

- Detectar modo:
  - `supabase` se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` existirem.
  - `demo` se não existirem.
- Criar cliente Supabase quando configurado.
- Ler promoções públicas.
- Ler promoções administrativas.
- Criar promoção.
- Editar promoção.
- Excluir promoção.
- Upload de imagem.
- Ler configurações da loja.
- Editar configurações da loja.
- Login.
- Logout.
- Ler sessão.
- Reset de senha.
- Atualizar senha.

Funções esperadas:

```js
getBackendMode()
getInitialAppState()
listPublicPromotions()
listAdminPromotions()
savePromotion(promotion, imageFile)
deletePromotion(id)
getStoreSettings()
saveStoreSettings(settings)
login(email, password)
logout()
requestPasswordReset(email)
updatePassword(password)
```

No modo demo:

- Usar `localStorage`.
- Gerar IDs corretamente ao criar promoção.
- Evitar duplicidade de IDs.
- Simular login.
- Simular logout.
- Simular reset com mensagem clara.

No modo Supabase:

- Usar tabelas `promotions`, `store_settings`, `profiles`.
- Usar bucket `promotion-images`.
- Usar Supabase Auth.
- Ler role em `profiles`.
- Bloquear admin se role não for `admin`.

### Fase 4 - Schema Supabase

Criar `supabase/schema.sql`.

Tabelas:

#### `public.promotions`

Campos:

- `id text primary key default gen_random_uuid()::text`
- `name text not null`
- `category text not null`
- `description text default ''`
- `price numeric(10,2) not null check (price >= 0)`
- `original_price numeric(10,2) default 0 check (original_price >= 0)`
- `image text default ''`
- `active boolean default true`
- `created_at timestamptz default now()`

Adicionar melhoria:

- `check (original_price = 0 or original_price >= price)`

#### `public.store_settings`

Campos:

- `id text primary key default 'main'`
- `store_name text not null`
- `whatsapp_number text not null`
- `created_at timestamptz default now()`

Adicionar melhoria:

- `check (id = 'main')`
- Usar sempre `id = 'main'`

#### `public.profiles`

Campos:

- `id uuid primary key references auth.users(id) on delete cascade`
- `email text`
- `role text not null default 'viewer' check (role in ('admin', 'viewer'))`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Criar:

- Trigger para criar perfil quando usuário for criado
- Função `is_admin()`
- RLS para tabelas
- Políticas para leitura pública de promoções ativas
- Políticas para admin inserir, editar e deletar
- Bucket `promotion-images`
- Políticas de storage para leitura pública e escrita admin
- Seed inicial de configurações e promoções

### Fase 5 - Rotas

Criar rotas em `src/App.jsx`:

```jsx
<Routes>
  <Route path="/" element={<PublicCatalog />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<Navigate to="/login" replace />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  <Route path="/admin" element={<AdminPage />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

### Fase 6 - Página Pública

Criar catálogo com:

- Header/hero
- Nome da loja
- Badge do ambiente: `Demo` ou `Supabase`
- Link para admin
- Campo de busca
- Filtro por categoria
- Grid de promoções
- Empty state
- Footer

Regras:

- Mostrar apenas promoções ativas.
- Busca por nome.
- Filtro por categoria.
- Desconto só aparece se `originalPrice > 0`.
- Link WhatsApp deve usar:

```txt
https://wa.me/{whatsappNumber}?text={mensagemCodificada}
```

Mensagem sugerida:

```txt
Olá! Tenho interesse na promoção: {nome} por R$ {preço}.
```

### Fase 7 - Autenticação

Criar telas:

- `/login`
- `/forgot-password`
- `/reset-password`

Login:

- Email obrigatório.
- Senha obrigatória.
- Se role não for `admin`, não permitir entrar no painel.
- Após login com sucesso, redirecionar para `/admin`.

Reset:

- Solicitar email.
- Em Supabase, chamar reset por email.
- Em demo, explicar que é simulado.
- Em `/reset-password`, confirmar senha.
- Validar senhas iguais.
- Aplicar nova senha no Supabase.

### Fase 8 - Painel Administrativo

Criar `/admin`.

Proteção:

- Se não estiver logado, redirecionar para `/login`.
- Se role não for `admin`, mostrar estado restrito.

Admin deve ter:

- Header sticky
- Marca
- Badge de ambiente
- Link para catálogo
- Botão configurações
- Botão logout
- Título "Painel Administrativo"
- Contagem de promoções
- Botão "Nova Promoção"
- Lista de promoções
- Ações de editar e excluir
- Status ativo/inativo

### Fase 9 - Formulário de Promoção

Criar modal para criar/editar promoção.

Campos:

- Nome
- Categoria
- Descrição
- Preço promocional
- Preço original
- Imagem por URL
- Upload de imagem
- Ativo/Inativo

Validações:

- Nome obrigatório.
- Categoria obrigatória.
- Preço promocional obrigatório.
- Preço não pode ser negativo.
- Preço original não pode ser negativo.
- Se preço original existir, deve ser maior ou igual ao preço promocional.
- Upload apenas imagem.
- Definir tamanho máximo recomendado para imagem, por exemplo 3MB.

UX:

- Mostrar preview da imagem.
- Permitir limpar imagem.
- Mostrar mensagem de salvamento.
- Desabilitar botão enquanto salva.
- Exibir erro em caso de falha.

### Fase 10 - Configurações da Loja

Criar modal de configurações.

Campos:

- Nome da loja
- Número de WhatsApp

Validações:

- Nome obrigatório.
- WhatsApp obrigatório.
- WhatsApp deve conter apenas números.
- WhatsApp deve incluir código do país e DDD.
- Exemplo: `5565999999999`.

Salvar em:

- `localStorage`, no modo demo.
- `store_settings`, no modo Supabase com `id = 'main'`.

### Fase 11 - Segurança e Regras de Negócio

Implementar:

- Promoção pública somente se `active = true`.
- Admin pode ver ativas e inativas.
- Apenas admin pode criar/editar/deletar promoções no modo Supabase.
- Apenas admin pode editar configurações.
- Apenas admin pode fazer upload.
- Usuário novo no Supabase começa como `viewer`.
- Promoção de usuário para admin deve ser manual via SQL documentado.
- Não expor service role key no front-end.
- Não salvar valores sensíveis reais no repositório.

### Fase 12 - Correções Técnicas Importantes

Implementar melhorias encontradas na auditoria:

- Gerar ID no modo demo ao criar promoção.
- Corrigir `store_settings` para registro único.
- Recarregar promoções/configurações após login.
- Evitar múltiplos registros de configuração.
- Criar confirmação antes de deletar.
- Adicionar `@keyframes spin`.
- Criar estilo para `disabled`.
- Melhorar validação de WhatsApp.
- Melhorar validação de preço.
- Melhorar acessibilidade dos modais.
- Remover ou evitar CSS órfão como `.otp-block`, exceto se for usado.

### Fase 13 - CSS e Design

Criar `src/styles.css` com:

- Reset básico
- Tokens em `:root`
- Tipografia
- Layout container
- Hero
- Busca
- Categorias
- Grid
- Cards
- Botões
- Forms
- Modais
- Admin
- Auth
- Mensagens
- Estados vazios
- Loading
- Responsividade

Componentes devem seguir:

- Cards brancos
- Radius entre `12px` e `20px`
- Sombras suaves
- Hero laranja com gradiente
- WhatsApp verde
- Botões com hover e active
- Inputs com foco laranja suave
- Mensagens inline de erro/sucesso/info

### Fase 14 - README

Criar `README.md` com:

- Nome do projeto
- Descrição
- Tecnologias
- Como instalar
- Como rodar em modo demo
- Como configurar Supabase
- Como executar schema SQL
- Como criar admin
- Como configurar reset de senha
- Variáveis de ambiente
- Scripts disponíveis
- Como fazer build
- Observações de segurança

### Fase 15 - Validação

Executar:

```bash
npm install
npm run build
npm run preview
```

Testes manuais obrigatórios:

- Abrir catálogo público
- Buscar produto
- Filtrar categoria
- Clicar WhatsApp
- Entrar no login
- Logar como admin no modo demo
- Criar promoção
- Editar promoção
- Ativar/desativar promoção
- Excluir promoção com confirmação
- Editar configurações da loja
- Testar reset de senha em modo demo
- Testar responsividade mobile
- Testar navegação por teclado básica
- Validar build sem erro

## Concrete Steps

### 1. Criar projeto

```bash
npm create vite@latest . -- --template react
npm install
npm install react-router-dom @supabase/supabase-js
```

### 2. Criar arquivos principais

Criar ou substituir:

```txt
src/main.jsx
src/App.jsx
src/styles.css
src/data.js
src/lib/appBackend.js
.env.example
supabase/schema.sql
README.md
```

### 3. Implementar dados demo

Adicionar categorias, promoções e credencial demo.

### 4. Implementar backend abstraction

Criar funções de dados para modo demo e modo Supabase.

### 5. Implementar UI pública

Criar catálogo, busca, filtro e cards.

### 6. Implementar autenticação

Criar login, forgot password e reset password.

### 7. Implementar admin

Criar painel, lista, modais e CRUD.

### 8. Implementar Supabase

Criar schema SQL, RLS, storage e seeds.

### 9. Implementar estilos

Aplicar design system e responsividade.

### 10. Validar

Rodar build, testar fluxos e atualizar este PLANS.md.

## Validation and Acceptance

O projeto será aceito quando:

- [x] `npm install` funciona
- [ ] `npm run dev` funciona
- [x] `npm run build` funciona
- [ ] A home `/` mostra catálogo público
- [ ] A busca por produto funciona
- [ ] O filtro por categoria funciona
- [ ] O botão WhatsApp abre link correto
- [ ] Apenas promoções ativas aparecem para o público
- [ ] `/login` permite login admin no modo demo
- [ ] `/admin` é protegido
- [ ] Admin cria promoção
- [ ] Admin edita promoção
- [ ] Admin exclui promoção com confirmação
- [ ] Admin ativa/desativa promoção
- [ ] Admin altera nome da loja
- [ ] Admin altera WhatsApp
- [ ] Modo demo persiste dados no `localStorage`
- [ ] Modo Supabase funciona com `.env`
- [ ] Upload de imagem funciona no Supabase
- [ ] Reset de senha funciona no Supabase
- [ ] Design usa Poppins e Inter
- [ ] Paleta laranja/verde/neutra está aplicada
- [ ] Layout é responsivo
- [ ] Botões disabled têm estilo visível
- [ ] Loading tem animação funcional
- [ ] Modais têm acessibilidade básica
- [ ] README explica instalação e Supabase

## Idempotence and Recovery

Este plano deve ser executado de forma segura e incremental.

Regras:

- Antes de alterar arquivo existente, ler o arquivo.
- Não apagar funcionalidades já prontas sem necessidade.
- Após cada fase, atualizar `Progress`.
- Se um comando falhar, registrar em `Surprises & Discoveries`.
- Se uma decisão mudar, registrar em `Decision Log`.
- Se o projeto já tiver arquivos, adaptar em vez de recriar cegamente.
- Se uma implementação quebrar build, corrigir antes de avançar.
- Não usar service role key no front-end.
- Não expor credenciais reais.
- Não depender de imagens externas para funcionalidades críticas.
- Não transformar o projeto em backend próprio sem necessidade.

## Artifacts and Notes

Artefatos esperados:

```txt
PLANS.md
README.md
.env.example
supabase/schema.sql
src/main.jsx
src/App.jsx
src/styles.css
src/data.js
src/lib/appBackend.js
```

Documentos usados como base:

- `auditoria.md`
- `design-system.md`

Notas importantes:

- O projeto é uma SPA.
- O sistema não deve ter API REST própria.
- O Supabase é o backend real.
- O modo demo deve funcionar sem configuração.
- O design deve ser mantido simples, comercial e promocional.
- Melhorias de segurança e UX devem ser priorizadas antes de estética secundária.

## Interfaces and Dependencies

### Front-end

- React 18
- React DOM
- React Router DOM 6
- Vite 5
- CSS puro

### Supabase

- `@supabase/supabase-js`
- Supabase Auth
- Supabase Postgres
- Supabase Storage

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_BUCKET=promotion-images
```

### LocalStorage

Chaves esperadas no modo demo:

```txt
super-ofertas-promotions
super-ofertas-store
super-ofertas-auth
```

### Tabelas Supabase

```txt
public.promotions
public.store_settings
public.profiles
auth.users
```

### Storage

```txt
promotion-images
```

### URLs externas

```txt
https://wa.me/{numero}?text={mensagem}
Google Fonts
```

## Execution Rule for Codex

Ao executar este PLANS.md, trate este arquivo como fonte principal do projeto.

Sempre:

1. Leia este PLANS.md antes de agir.
2. Atualize o progresso.
3. Execute uma fase por vez.
4. Valide antes de avançar.
5. Corrija erros encontrados.
6. Não invente requisitos fora deste documento.
7. Se precisar decidir, registre a decisão.
8. Se encontrar problema, registre em `Surprises & Discoveries`.
9. Mantenha o projeto funcionando durante a execução.
10. No final, atualize `Outcomes & Retrospective`.

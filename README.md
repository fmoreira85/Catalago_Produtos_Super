# Super Ofertas

SPA em React para catálogo de promoções de supermercado com página pública, painel administrativo, modo demo com `localStorage` e modo real com Supabase Auth, Postgres e Storage.

## Tecnologias

- React 18
- Vite 5
- React Router DOM 6
- CSS puro em `src/styles.css`
- Supabase JavaScript SDK

## Funcionalidades

- Catálogo público com busca por nome
- Filtro por categoria
- Cards de promoção com CTA de WhatsApp
- Login administrativo
- Painel admin protegido
- CRUD de promoções
- Upload de imagem
- Configurações da loja
- Recuperação e redefinição de senha
- Modo demo sem dependência de Supabase
- Modo Supabase com Auth, Postgres e Storage

## Instalação

```bash
npm install
```

## Rodando em modo demo

Sem `.env`, a aplicação entra automaticamente em modo `demo`.

```bash
npm run dev
```

Credencial demo padrão:

- E-mail: `admin@demo.com`
- Senha: `123456`

Importante: essa credencial existe apenas para simulação local e não representa segurança real.

## Configurando Supabase

1. Crie um projeto no Supabase.
2. Copie `.env.example` para `.env`.
3. Preencha as variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_SUPABASE_BUCKET=promotion-images
```

4. Execute o SQL de [supabase/schema.sql](/c:/Users/fabio/Catalago_Produtos_Super/supabase/schema.sql).
5. No painel do Supabase, crie um usuário via Auth.
6. Promova o usuário para admin manualmente:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@sualoja.com';
```

## Reset de senha no Supabase

- Configure o site URL do projeto no painel do Supabase Auth.
- Garanta que o redirecionamento para `/reset-password` esteja permitido.
- A tela de recuperação usa `resetPasswordForEmail`.

## Scripts disponíveis

- `npm run dev`: inicia o ambiente de desenvolvimento
- `npm run build`: gera o build de produção
- `npm run preview`: abre o preview do build local

## Build

```bash
npm run build
```

## Estrutura principal

```txt
src/
  App.jsx
  data.js
  main.jsx
  styles.css
  lib/
    appBackend.js
supabase/
  schema.sql
```

## Segurança

- Nunca use service role key no front-end.
- Use apenas a `anon key` no `.env`.
- O modo demo salva tudo localmente no navegador.
- O controle de admin no modo real depende de `profiles.role = 'admin'`.

## Como validar

- Abrir `/`
- Buscar promoções por nome
- Filtrar por categoria
- Testar CTA de WhatsApp
- Fazer login no `/login`
- Criar, editar e excluir promoções em `/admin`
- Alterar configurações da loja
- Testar recuperação e redefinição de senha
- Confirmar que `npm run build` conclui sem erro

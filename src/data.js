const createPromoImage = (label, tone, accent) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="hero" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${tone}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" rx="60" fill="url(#hero)" />
      <circle cx="970" cy="180" r="130" fill="rgba(255,255,255,0.18)" />
      <circle cx="240" cy="720" r="170" fill="rgba(255,255,255,0.14)" />
      <text x="80" y="280" fill="white" font-family="Poppins, Arial, sans-serif" font-size="78" font-weight="700">
        Super Oferta
      </text>
      <text x="80" y="410" fill="white" font-family="Inter, Arial, sans-serif" font-size="148" font-weight="800">
        ${label}
      </text>
      <text x="80" y="520" fill="rgba(255,255,255,0.92)" font-family="Inter, Arial, sans-serif" font-size="38">
        Qualidade, economia e frescor para a sua compra.
      </text>
      <rect x="80" y="618" width="260" height="74" rx="37" fill="rgba(255,255,255,0.18)" />
      <text x="128" y="665" fill="white" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700">
        Oferta do dia
      </text>
    </svg>
  `)}`;

export const DEFAULT_STORE = {
  storeName: "Super Ofertas",
  whatsappNumber: "5565999999999",
};

export const CATEGORIES = [
  "Todos",
  "Frutas",
  "Hortifruti",
  "Açougue",
  "Bebidas",
  "Mercearia",
  "Limpeza",
  "Padaria",
  "Frios",
];

export const DEMO_ADMIN = {
  email: "admin@demo.com",
  password: "123456",
};

export const DEMO_PROMOTIONS = [
  {
    id: "promo-banana",
    name: "Banana Prata",
    category: "Frutas",
    description: "Cacho selecionado, ideal para o café da manhã e lanches.",
    price: 5.99,
    originalPrice: 7.49,
    image: createPromoImage("Banana", "#f59e0b", "#fb923c"),
    active: true,
  },
  {
    id: "promo-picanha",
    name: "Picanha Bovina",
    category: "Açougue",
    description: "Corte nobre resfriado com excelente marmoreio.",
    price: 54.9,
    originalPrice: 63.9,
    image: createPromoImage("Picanha", "#b91c1c", "#f97316"),
    active: true,
  },
  {
    id: "promo-refrigerante",
    name: "Refrigerante Cola 2L",
    category: "Bebidas",
    description: "Perfeito para reunir a família no almoço de domingo.",
    price: 8.49,
    originalPrice: 9.99,
    image: createPromoImage("Refri 2L", "#7c3aed", "#ef4444"),
    active: true,
  },
  {
    id: "promo-arroz",
    name: "Arroz Tipo 1 5kg",
    category: "Mercearia",
    description: "Pacote econômico para o dia a dia da sua casa.",
    price: 22.9,
    originalPrice: 27.5,
    image: createPromoImage("Arroz", "#0f766e", "#14b8a6"),
    active: true,
  },
  {
    id: "promo-detergente",
    name: "Detergente Neutro 500ml",
    category: "Limpeza",
    description: "Rende mais e ajuda na limpeza completa da cozinha.",
    price: 2.79,
    originalPrice: 3.5,
    image: createPromoImage("Detergente", "#0284c7", "#22c55e"),
    active: true,
  },
  {
    id: "promo-pao",
    name: "Pão Francês",
    category: "Padaria",
    description: "Quentinho a toda hora, vendido por quilo.",
    price: 13.9,
    originalPrice: 0,
    image: createPromoImage("Padaria", "#d97706", "#facc15"),
    active: true,
  },
  {
    id: "promo-mussarela",
    name: "Mussarela Fatiada",
    category: "Frios",
    description: "Fatiada na hora para sanduíches e receitas.",
    price: 4.99,
    originalPrice: 6.29,
    image: createPromoImage("Mussarela", "#65a30d", "#84cc16"),
    active: true,
  },
  {
    id: "promo-cafe",
    name: "Café Tradicional 500g",
    category: "Mercearia",
    description: "Torra equilibrada para deixar a rotina mais gostosa.",
    price: 15.99,
    originalPrice: 19.99,
    image: createPromoImage("Café", "#78350f", "#b45309"),
    active: false,
  },
];

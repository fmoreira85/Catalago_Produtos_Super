import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  useDeferredValue,
} from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { CATEGORIES, DEFAULT_STORE, DEMO_ADMIN } from "./data";
import {
  deletePromotion,
  getBackendMode,
  getInitialAppState,
  getStoreSettings,
  listAdminPromotions,
  listPublicPromotions,
  login,
  logout,
  requestPasswordReset,
  savePromotion,
  saveStoreSettings,
  subscribeToAuthChanges,
  updatePassword,
} from "./lib/appBackend";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const getDiscountPercentage = (price, originalPrice) => {
  if (!originalPrice || originalPrice <= price) {
    return null;
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

const buildWhatsAppLink = (promotionName, price, whatsappNumber) => {
  const message = `Olá! Tenho interesse na promoção: ${promotionName} por ${formatCurrency(price)}.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

const validatePromotion = (promotion, imageFile) => {
  const errors = {};
  const price = Number(promotion.price);
  const originalPrice = Number(promotion.originalPrice || 0);

  if (!promotion.name.trim()) {
    errors.name = "Informe o nome da promoção.";
  }

  if (!promotion.category.trim()) {
    errors.category = "Selecione uma categoria.";
  }

  if (Number.isNaN(price)) {
    errors.price = "Informe um preço promocional válido.";
  } else if (price < 0) {
    errors.price = "O preço promocional não pode ser negativo.";
  }

  if (Number.isNaN(originalPrice)) {
    errors.originalPrice = "Informe um preço original válido.";
  } else if (originalPrice < 0) {
    errors.originalPrice = "O preço original não pode ser negativo.";
  } else if (originalPrice > 0 && originalPrice < price) {
    errors.originalPrice =
      "O preço original deve ser maior ou igual ao preço promocional.";
  }

  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) {
      errors.image = "O upload precisa ser um arquivo de imagem.";
    }

    if (imageFile.size > 3 * 1024 * 1024) {
      errors.image = "A imagem deve ter no máximo 3MB.";
    }
  }

  return errors;
};

const validateStoreSettings = (settings) => {
  const errors = {};

  if (!settings.storeName.trim()) {
    errors.storeName = "Informe o nome da loja.";
  }

  if (!settings.whatsappNumber.trim()) {
    errors.whatsappNumber = "Informe o número do WhatsApp.";
  } else if (!/^\d{12,15}$/.test(settings.whatsappNumber.trim())) {
    errors.whatsappNumber =
      "Use apenas números, com código do país e DDD. Exemplo: 5565999999999.";
  }

  return errors;
};

const getInitialPromotionForm = (promotion) => ({
  id: promotion?.id || "",
  name: promotion?.name || "",
  category:
    promotion?.category || CATEGORIES.find((category) => category !== "Todos") || "",
  description: promotion?.description || "",
  price: promotion?.price ?? "",
  originalPrice: promotion?.originalPrice ?? "",
  image: promotion?.image || "",
  active: promotion?.active ?? true,
});

function App() {
  const [booting, setBooting] = useState(true);
  const [mode, setMode] = useState(getBackendMode());
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("guest");
  const [storeSettings, setStoreSettingsState] = useState(DEFAULT_STORE);
  const [publicPromotions, setPublicPromotions] = useState([]);
  const [adminPromotions, setAdminPromotions] = useState([]);
  const [flashMessage, setFlashMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadPublicData = async () => {
      const [promotions, store] = await Promise.all([
        listPublicPromotions(),
        getStoreSettings(),
      ]);

      if (cancelled) {
        return;
      }

      setPublicPromotions(promotions);
      setStoreSettingsState(store);
    };

    const loadAdminData = async () => {
      const promotions = await listAdminPromotions();

      if (cancelled) {
        return;
      }

      setAdminPromotions(promotions);
    };

    const bootstrap = async () => {
      try {
        const initialState = await getInitialAppState();

        if (cancelled) {
          return;
        }

        setMode(initialState.mode);
        setSession(initialState.session);
        setUserRole(initialState.userRole);
        setStoreSettingsState(initialState.storeSettings);

        await loadPublicData();

        if (initialState.session && initialState.userRole === "admin") {
          await loadAdminData();
        }
      } catch (error) {
        if (!cancelled) {
          setFlashMessage({
            type: "error",
            text:
              error.message ||
              "Não foi possível carregar a aplicação. Tente atualizar a página.",
          });
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    };

    bootstrap();

    const unsubscribe = subscribeToAuthChanges(async ({ session: nextSession, userRole: nextRole }) => {
      if (cancelled) {
        return;
      }

      setSession(nextSession);
      setUserRole(nextRole);

      await loadPublicData();

      if (nextSession && nextRole === "admin") {
        await loadAdminData();
      } else {
        setAdminPromotions([]);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!flashMessage) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setFlashMessage(null);
    }, 4200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [flashMessage]);

  const refreshPublicData = async () => {
    const [promotions, store] = await Promise.all([
      listPublicPromotions(),
      getStoreSettings(),
    ]);

    setPublicPromotions(promotions);
    setStoreSettingsState(store);
  };

  const refreshAdminData = async (nextSession = session, nextUserRole = userRole) => {
    if (nextSession && nextUserRole === "admin") {
      const promotions = await listAdminPromotions();
      setAdminPromotions(promotions);
    } else {
      setAdminPromotions([]);
    }
  };

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    setSession(result.session);
    setUserRole(result.userRole);
    await Promise.all([
      refreshPublicData(),
      refreshAdminData(result.session, result.userRole),
    ]);
    setFlashMessage({
      type: "success",
      text: "Login realizado com sucesso.",
    });
    return result;
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    setUserRole("guest");
    setAdminPromotions([]);
    await refreshPublicData();
    setFlashMessage({
      type: "info",
      text: "Sessão encerrada.",
    });
  };

  const handleSavePromotion = async (promotion, imageFile) => {
    await savePromotion(promotion, imageFile);
    await Promise.all([refreshPublicData(), refreshAdminData()]);
    setFlashMessage({
      type: "success",
      text: promotion.id
        ? "Promoção atualizada com sucesso."
        : "Promoção criada com sucesso.",
    });
  };

  const handleDeletePromotion = async (promotionId) => {
    await deletePromotion(promotionId);
    await Promise.all([refreshPublicData(), refreshAdminData()]);
    setFlashMessage({
      type: "success",
      text: "Promoção removida com sucesso.",
    });
  };

  const handleSaveStoreSettings = async (settings) => {
    const nextSettings = await saveStoreSettings(settings);
    setStoreSettingsState(nextSettings);
    await refreshPublicData();
    setFlashMessage({
      type: "success",
      text: "Configurações da loja atualizadas.",
    });
  };

  if (booting) {
    return <LoadingScreen />;
  }

  return (
    <div className="app-shell">
      {flashMessage ? <ToastMessage message={flashMessage} /> : null}

      <Routes>
        <Route
          path="/"
          element={
            <PublicCatalog
              mode={mode}
              promotions={publicPromotions}
              session={session}
              storeSettings={storeSettings}
            />
          }
        />
        <Route
          path="/login"
          element={
            session && userRole === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <LoginPage mode={mode} onLogin={handleLogin} />
            )
          }
        />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage mode={mode} onRequestReset={requestPasswordReset} />}
        />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage mode={mode} onUpdatePassword={updatePassword} />}
        />
        <Route
          path="/admin"
          element={
            <AdminRoute
              session={session}
              userRole={userRole}
              mode={mode}
              storeSettings={storeSettings}
              promotions={adminPromotions}
              onLogout={handleLogout}
              onSavePromotion={handleSavePromotion}
              onDeletePromotion={handleDeletePromotion}
              onSaveStoreSettings={handleSaveStoreSettings}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-screen__panel">
        <span className="eyebrow">Carregando catálogo</span>
        <h1>Super Ofertas</h1>
        <p>Preparando promoções, configurações da loja e acesso administrativo.</p>
        <div className="spinner" aria-hidden="true" />
      </div>
    </div>
  );
}

function ToastMessage({ message }) {
  return (
    <div className={`toast toast--${message.type}`} role="status" aria-live="polite">
      {message.text}
    </div>
  );
}

function PublicCatalog({ mode, promotions, session, storeSettings }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visiblePromotions = promotions.filter((promotion) => {
    const matchesCategory = category === "Todos" || promotion.category === category;
    const matchesQuery =
      normalizedQuery === "" ||
      promotion.name.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
  const categoriesWithOffers = new Set(promotions.map((promotion) => promotion.category)).size;
  const bestDeal = promotions.reduce((currentBest, promotion) => {
    const discount = getDiscountPercentage(promotion.price, promotion.originalPrice) || 0;

    if (!currentBest || discount > currentBest.discount) {
      return { promotion, discount };
    }

    return currentBest;
  }, null);
  return (
    <div className="public-page">
      <header className="hero">
        <div className="container">
          <div className="hero__topbar">
            <div>
              <p className="eyebrow">Catálogo promocional</p>
              <div className="brand-lockup">
                <h1>{storeSettings.storeName}</h1>
                <span className={`badge badge--${mode}`}>
                  {mode === "demo" ? "Demo" : "Supabase"}
                </span>
              </div>
            </div>

            <Link className="button button--ghost" to={session ? "/admin" : "/login"}>
              {session ? "Painel admin" : "Acesso admin"}
            </Link>
          </div>

          <div className="hero__content">
            <div className="hero__copy">
              <p className="hero__intro">Ofertas atualizadas para a sua compra render mais.</p>
              <h2>Encontre promoções reais sem perder tempo procurando.</h2>
              <p>
                Busque produtos, filtre por categoria e fale com a loja direto no
                WhatsApp quando encontrar a melhor oportunidade.
              </p>

              <div className="hero__stats">
                <span>{promotions.length} ofertas ativas</span>
                <span>{categoriesWithOffers} categorias</span>
                <span>{bestDeal?.discount ? `Até ${bestDeal.discount}% OFF` : "Novas ofertas"}</span>
              </div>

              <div className="hero__actions">
                <a className="button button--primary" href="#ofertas">
                  Ver ofertas agora
                </a>
                <a
                  className="button button--ghost hero__contact-button"
                  href={`https://wa.me/${storeSettings.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Falar com a loja
                </a>
              </div>
            </div>

            <div className="hero__search-card">
              <div className="hero__card-header">
                <div>
                  <span className="eyebrow">Busca rápida</span>
                  <h3>Encontre sua oferta em segundos</h3>
                  <p className="hero__card-copy">
                    Digite o produto ou escolha uma categoria para filtrar a vitrine.
                  </p>
                </div>
                <span className="hero__card-badge">
                  {isPending ? "Atualizando..." : `${visiblePromotions.length} resultado(s)`}
                </span>
              </div>

              <label className="field">
                <span className="field__label">Buscar promoção</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => {
                      setQuery(nextValue);
                    });
                  }}
                  placeholder="Ex.: café, banana, detergente..."
                />
              </label>

              <div className="category-pills" aria-label="Categorias">
                {CATEGORIES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`pill ${category === option ? "pill--active" : ""}`}
                    onClick={() => {
                      startTransition(() => {
                        setCategory(option);
                      });
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="hero__helper">
                <span>Filtro atual: {category}</span>
                <span>
                  {normalizedQuery ? `Busca: "${deferredQuery}"` : "Use categorias para refinar"}
                </span>
              </div>

            </div>
          </div>
        </div>
      </header>

      <main id="ofertas" className="catalog-section">
        <div className="container">
          {visiblePromotions.length > 0 ? (
            <div className="promotion-grid">
              {visiblePromotions.map((promotion) => (
                <PromotionCard
                  key={promotion.id}
                  promotion={promotion}
                  whatsappNumber={storeSettings.whatsappNumber}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma promoção encontrada"
              description="Tente ajustar a busca ou limpar o filtro de categoria para ver mais resultados."
            />
          )}
        </div>
      </main>

      <footer className="public-footer">
        <div className="container public-footer__content">
          <div>
            <h3>{storeSettings.storeName}</h3>
            <p>Catálogo simples, rápido e pronto para divulgar ofertas todos os dias.</p>
          </div>
          <a
            className="button button--whatsapp"
            href={`https://wa.me/${storeSettings.whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
          >
            Falar com a loja
          </a>
        </div>
      </footer>
    </div>
  );
}

function PromotionCard({ promotion, whatsappNumber }) {
  const discount = getDiscountPercentage(promotion.price, promotion.originalPrice);

  return (
    <article className="promotion-card">
      <div className="promotion-card__media">
        <img src={promotion.image} alt={promotion.name} loading="lazy" />
        {discount ? <span className="discount-badge">-{discount}%</span> : null}
      </div>

      <div className="promotion-card__content">
        <span className="category-tag">{promotion.category}</span>
        <h3>{promotion.name}</h3>
        <p>{promotion.description}</p>

        <div className="price-stack">
          <strong>{formatCurrency(promotion.price)}</strong>
          {promotion.originalPrice > 0 ? (
            <span>{formatCurrency(promotion.originalPrice)}</span>
          ) : null}
        </div>

        <a
          className="button button--whatsapp button--full"
          href={buildWhatsAppLink(
            promotion.name,
            promotion.price,
            whatsappNumber,
          )}
          target="_blank"
          rel="noreferrer"
        >
          Chamar no WhatsApp
        </a>
      </div>
    </article>
  );
}

function LoginPage({ mode, onLogin }) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(() =>
    mode === "demo"
      ? {
          email: DEMO_ADMIN.email,
          password: DEMO_ADMIN.password,
        }
      : {
          email: "",
          password: "",
        },
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isDemo = mode === "demo";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formState.email.trim() || !formState.password.trim()) {
      setError("Informe e-mail e senha para continuar.");
      return;
    }

    setSubmitting(true);

    try {
      await onLogin(formState.email.trim(), formState.password);
      navigate("/admin", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Acesso administrativo"
      description="Entre para cadastrar promoções, ajustar a loja e manter o catálogo sempre atualizado."
    >
      {isDemo ? (
        <MessageBlock type="info">
          Credencial demo: <strong>{DEMO_ADMIN.email}</strong> / <strong>{DEMO_ADMIN.password}</strong>.
          Esta conta existe apenas para testes locais e não representa segurança real.
        </MessageBlock>
      ) : null}

      <form className="panel auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">E-mail</span>
          <input
            type="email"
            value={formState.email}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="admin@sualoja.com"
            autoComplete="email"
          />
        </label>

        <label className="field">
          <span className="field__label">Senha</span>
          <input
            type="password"
            value={formState.password}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder="Sua senha"
            autoComplete="current-password"
          />
        </label>

        {error ? <MessageBlock type="error">{error}</MessageBlock> : null}

        <button className="button button--primary button--full" type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar no painel"}
        </button>

        <div className="auth-form__actions">
          <Link to="/forgot-password">Esqueci minha senha</Link>
          <Link to="/">Voltar ao catálogo</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function ForgotPasswordPage({ mode, onRequestReset }) {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!email.trim()) {
      setFeedback({
        type: "error",
        text: "Informe seu e-mail para solicitar a recuperação.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const result = await onRequestReset(email.trim());
      setFeedback({
        type: "success",
        text: result.message,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.message || "Não foi possível solicitar a recuperação.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar acesso"
      description="Solicite a redefinição da senha do painel administrativo."
    >
      {mode === "demo" ? (
        <MessageBlock type="info">
          No modo demo, o fluxo é simulado para que você possa testar a experiência sem e-mail real.
        </MessageBlock>
      ) : null}

      <form className="panel auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@sualoja.com"
            autoComplete="email"
          />
        </label>

        {feedback ? <MessageBlock type={feedback.type}>{feedback.text}</MessageBlock> : null}

        <button className="button button--primary button--full" type="submit" disabled={submitting}>
          {submitting ? "Enviando..." : "Solicitar recuperação"}
        </button>

        <div className="auth-form__actions">
          <Link to="/reset-password">Ir para redefinição</Link>
          <Link to="/login">Voltar ao login</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function ResetPasswordPage({ mode, onUpdatePassword }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!password.trim() || !confirmPassword.trim()) {
      setFeedback({
        type: "error",
        text: "Preencha a nova senha e a confirmação.",
      });
      return;
    }

    if (password.length < 6) {
      setFeedback({
        type: "error",
        text: "Use uma senha com pelo menos 6 caracteres.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        type: "error",
        text: "As senhas não coincidem.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const result = await onUpdatePassword(password);
      setFeedback({
        type: "success",
        text: result.message,
      });
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.message || "Não foi possível redefinir a senha.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Redefinir senha"
      description="Atualize a senha usada para acessar o painel administrativo."
    >
      {mode === "demo" ? (
        <MessageBlock type="info">
          No modo demo, a nova senha fica salva no navegador local para você testar o fluxo completo.
        </MessageBlock>
      ) : null}

      <form className="panel auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Nova senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>

        <label className="field">
          <span className="field__label">Confirmar senha</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>

        {feedback ? <MessageBlock type={feedback.type}>{feedback.text}</MessageBlock> : null}

        <button className="button button--primary button--full" type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar nova senha"}
        </button>

        <div className="auth-form__actions">
          <Link to="/login">Voltar ao login</Link>
          <Link to="/">Ir para o catálogo</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ title, description, children }) {
  return (
    <div className="auth-page">
      <div className="container auth-page__grid">
        <section className="auth-page__hero">
          <span className="eyebrow">Painel da loja</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <ul className="auth-page__benefits">
            <li>Atualize promoções em minutos</li>
            <li>Mantenha a loja visível para o público</li>
            <li>Use modo demo ou Supabase real</li>
          </ul>
        </section>

        <section>{children}</section>
      </div>
    </div>
  );
}

function AdminRoute({
  session,
  userRole,
  mode,
  storeSettings,
  promotions,
  onLogout,
  onSavePromotion,
  onDeletePromotion,
  onSaveStoreSettings,
}) {
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (userRole !== "admin") {
    return (
      <RestrictedState
        title="Acesso restrito"
        description="Esta conta não possui permissão administrativa. Solicite promoção de perfil para admin no Supabase."
      />
    );
  }

  return (
    <AdminPage
      mode={mode}
      storeSettings={storeSettings}
      promotions={promotions}
      onLogout={onLogout}
      onSavePromotion={onSavePromotion}
      onDeletePromotion={onDeletePromotion}
      onSaveStoreSettings={onSaveStoreSettings}
    />
  );
}

function AdminPage({
  mode,
  storeSettings,
  promotions,
  onLogout,
  onSavePromotion,
  onDeletePromotion,
  onSaveStoreSettings,
}) {
  const [promotionModalState, setPromotionModalState] = useState({
    open: false,
    promotion: null,
  });
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const [submittingPromotion, setSubmittingPromotion] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [togglingPromotionId, setTogglingPromotionId] = useState("");

  const activeCount = promotions.filter((promotion) => promotion.active).length;

  const handlePromotionSubmit = async (promotion, imageFile) => {
    setSubmittingPromotion(true);

    try {
      await onSavePromotion(promotion, imageFile);
      setPromotionModalState({
        open: false,
        promotion: null,
      });
    } finally {
      setSubmittingPromotion(false);
    }
  };

  const handleSettingsSubmit = async (settings) => {
    setSavingSettings(true);

    try {
      await onSaveStoreSettings(settings);
      setSettingsModalOpen(false);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDelete = async () => {
    if (!promotionToDelete) {
      return;
    }

    await onDeletePromotion(promotionToDelete.id);
    setPromotionToDelete(null);
  };

  const handleTogglePromotion = async (promotion) => {
    setTogglingPromotionId(promotion.id);

    try {
      await onSavePromotion(
        {
          ...promotion,
          active: !promotion.active,
        },
        null,
      );
    } finally {
      setTogglingPromotionId("");
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="container admin-header__content">
          <div>
            <p className="eyebrow">Gestão da loja</p>
            <div className="brand-lockup brand-lockup--dark">
              <h1>{storeSettings.storeName}</h1>
              <span className={`badge badge--${mode}`}>
                {mode === "demo" ? "Demo" : "Supabase"}
              </span>
            </div>
          </div>

          <div className="admin-header__actions">
            <Link className="button button--ghost" to="/">
              Ver catálogo
            </Link>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setSettingsModalOpen(true)}
            >
              Configurações
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={async () => {
                setLoggingOut(true);

                try {
                  await onLogout();
                } finally {
                  setLoggingOut(false);
                }
              }}
              disabled={loggingOut}
            >
              {loggingOut ? "Saindo..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="admin-content">
        <div className="container">
          <section className="admin-overview">
            <div className="panel admin-overview__summary">
              <div>
                <span className="eyebrow">Painel Administrativo</span>
                <h2>Gerencie promoções, disponibilidade e contato da loja.</h2>
              </div>
              <button
                type="button"
                className="button button--primary"
                onClick={() =>
                  setPromotionModalState({
                    open: true,
                    promotion: null,
                  })
                }
              >
                Nova Promoção
              </button>
            </div>

            <div className="stats-grid">
              <article className="panel stat-card">
                <span>Total de promoções</span>
                <strong>{promotions.length}</strong>
              </article>
              <article className="panel stat-card">
                <span>Ativas no catálogo</span>
                <strong>{activeCount}</strong>
              </article>
              <article className="panel stat-card">
                <span>Ocultas</span>
                <strong>{promotions.length - activeCount}</strong>
              </article>
            </div>
          </section>

          <section className="panel admin-list">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Promoções cadastradas</span>
                <h3>{promotions.length ? "Lista de ofertas" : "Seu painel ainda está vazio"}</h3>
              </div>
            </div>

            {promotions.length > 0 ? (
              <div className="admin-card-list">
                {promotions.map((promotion) => (
                  <article key={promotion.id} className="admin-card">
                    <img src={promotion.image} alt={promotion.name} />
                    <div className="admin-card__body">
                      <div className="admin-card__header">
                        <div>
                          <span className="category-tag">{promotion.category}</span>
                          <h4>{promotion.name}</h4>
                        </div>
                        <span
                          className={`status-pill ${promotion.active ? "status-pill--active" : "status-pill--inactive"}`}
                        >
                          {promotion.active ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      <p>{promotion.description}</p>

                      <div className="admin-card__meta">
                        <strong>{formatCurrency(promotion.price)}</strong>
                        {promotion.originalPrice > 0 ? (
                          <span>{formatCurrency(promotion.originalPrice)}</span>
                        ) : (
                          <span>Sem preço original</span>
                        )}
                      </div>

                      <div className="admin-card__actions">
                        <button
                          type="button"
                          className={`button ${
                            promotion.active ? "button--warning" : "button--success"
                          }`}
                          disabled={togglingPromotionId === promotion.id}
                          onClick={() => handleTogglePromotion(promotion)}
                        >
                          {togglingPromotionId === promotion.id
                            ? "Atualizando..."
                            : promotion.active
                              ? "Desativar"
                              : "Ativar"}
                        </button>
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() =>
                            setPromotionModalState({
                              open: true,
                              promotion,
                            })
                          }
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="button button--danger"
                          onClick={() => setPromotionToDelete(promotion)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma promoção cadastrada"
                description="Crie a primeira oferta para começar a abastecer o catálogo público."
              />
            )}
          </section>
        </div>
      </main>

      <PromotionModal
        open={promotionModalState.open}
        promotion={promotionModalState.promotion}
        submitting={submittingPromotion}
        onClose={() =>
          setPromotionModalState({
            open: false,
            promotion: null,
          })
        }
        onSubmit={handlePromotionSubmit}
      />

      <StoreSettingsModal
        open={settingsModalOpen}
        settings={storeSettings}
        submitting={savingSettings}
        onClose={() => setSettingsModalOpen(false)}
        onSubmit={handleSettingsSubmit}
      />

      <ConfirmDialog
        open={Boolean(promotionToDelete)}
        title="Excluir promoção"
        description={
          promotionToDelete
            ? `Tem certeza que deseja excluir "${promotionToDelete.name}"? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir promoção"
        onClose={() => setPromotionToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function PromotionModal({ open, promotion, submitting, onClose, onSubmit }) {
  const [formState, setFormState] = useState(getInitialPromotionForm(promotion));
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormState(getInitialPromotionForm(promotion));
    setErrors({});
    setImageFile(null);
    setPreviewUrl(promotion?.image || "");
    setSubmitError("");
  }, [open, promotion]);

  useEffect(() => {
    if (!imageFile) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validatePromotion(formState, imageFile);
    setErrors(validationErrors);
    setSubmitError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await onSubmit(
        {
          ...formState,
          price: Number(formState.price),
          originalPrice: Number(formState.originalPrice || 0),
        },
        imageFile,
      );
    } catch (error) {
      setSubmitError(error.message || "Não foi possível salvar a promoção.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={promotion ? "Editar promoção" : "Nova promoção"}
      description="Preencha os dados, escolha a melhor imagem e controle se a oferta aparece no catálogo público."
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Nome</span>
            <input
              type="text"
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            {errors.name ? <span className="field__error">{errors.name}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">Categoria</span>
            <select
              value={formState.category}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            >
              {CATEGORIES.filter((category) => category !== "Todos").map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category ? <span className="field__error">{errors.category}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">Preço promocional</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.price}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
            />
            {errors.price ? <span className="field__error">{errors.price}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">Preço original</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.originalPrice}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  originalPrice: event.target.value,
                }))
              }
            />
            {errors.originalPrice ? (
              <span className="field__error">{errors.originalPrice}</span>
            ) : null}
          </label>

          <label className="field field--full">
            <span className="field__label">Descrição</span>
            <textarea
              rows="4"
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <label className="field field--full">
            <span className="field__label">Imagem por URL</span>
            <input
              type="url"
              value={formState.image}
              onChange={(event) => {
                setImageFile(null);
                setPreviewUrl(event.target.value);
                setFormState((current) => ({
                  ...current,
                  image: event.target.value,
                }));
              }}
              placeholder="https://..."
            />
          </label>

          <label className="field field--full">
            <span className="field__label">Upload de imagem</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setImageFile(file);
              }}
            />
            <span className="field__hint">Formatos comuns de imagem e até 3MB.</span>
            {errors.image ? <span className="field__error">{errors.image}</span> : null}
          </label>

          <label className="checkbox-field field--full">
            <input
              type="checkbox"
              checked={formState.active}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  active: event.target.checked,
                }))
              }
            />
            <span>
              {formState.active
                ? "Promoção ativa: aparece no catálogo público."
                : "Promoção inativa: fica oculta no catálogo público."}
            </span>
          </label>
        </div>

        <div className="image-preview">
          <span className="field__label">Preview</span>
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Pré-visualização da promoção" />
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setImageFile(null);
                  setPreviewUrl("");
                  setFormState((current) => ({
                    ...current,
                    image: "",
                  }));
                }}
              >
                Limpar imagem
              </button>
            </>
          ) : (
            <div className="image-preview__empty">Adicione uma URL ou faça upload para ver a imagem.</div>
          )}
        </div>

        {submitError ? <MessageBlock type="error">{submitError}</MessageBlock> : null}

        <div className="modal-actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar promoção"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function StoreSettingsModal({ open, settings, submitting, onClose, onSubmit }) {
  const [formState, setFormState] = useState(settings);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormState(settings);
    setErrors({});
    setSubmitError("");
  }, [open, settings]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateStoreSettings(formState);
    setErrors(validationErrors);
    setSubmitError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await onSubmit(formState);
    } catch (error) {
      setSubmitError(error.message || "Não foi possível salvar as configurações.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurações da loja"
      description="Atualize o nome da marca exibido no catálogo e o WhatsApp usado nos contatos."
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Nome da loja</span>
          <input
            type="text"
            value={formState.storeName}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                storeName: event.target.value,
              }))
            }
          />
          {errors.storeName ? <span className="field__error">{errors.storeName}</span> : null}
        </label>

        <label className="field">
          <span className="field__label">WhatsApp da loja</span>
          <input
            type="text"
            inputMode="numeric"
            value={formState.whatsappNumber}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                whatsappNumber: event.target.value.replace(/\D/g, ""),
              }))
            }
            placeholder="5565999999999"
          />
          {errors.whatsappNumber ? (
            <span className="field__error">{errors.whatsappNumber}</span>
          ) : null}
        </label>

        {submitError ? <MessageBlock type="error">{submitError}</MessageBlock> : null}

        <div className="modal-actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="confirm-dialog">
        <MessageBlock type="warning">
          Revise a ação antes de continuar. A exclusão remove a oferta do catálogo e do painel.
        </MessageBlock>

        <div className="modal-actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="button button--danger"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);

              try {
                await onConfirm();
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ open, onClose, title, description, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const dialogElement = dialogRef.current;
    const previousActiveElement = document.activeElement;
    const bodyOverflow = document.body.style.overflow;

    const focusables = dialogElement?.querySelectorAll(focusableSelector) || [];
    const initialFocusElement = focusables[0] || dialogElement;

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      initialFocusElement?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const nodes = dialogElement?.querySelectorAll(focusableSelector) || [];

      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }

      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = bodyOverflow;

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex="-1"
      >
        <div className="modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId}>{description}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>

        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

function MessageBlock({ type, children }) {
  return <div className={`message-block message-block--${type}`}>{children}</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="panel empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function RestrictedState({ title, description }) {
  return (
    <div className="restricted-page">
      <div className="container">
        <div className="panel restricted-card">
          <span className="eyebrow">Permissão insuficiente</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <Link className="button button--primary" to="/">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}

export default App;

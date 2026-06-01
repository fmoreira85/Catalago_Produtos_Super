import { createClient } from "@supabase/supabase-js";
import { DEFAULT_STORE, DEMO_ADMIN, DEMO_PROMOTIONS } from "../data";

const PROMOTIONS_STORAGE_KEY = "super-ofertas-promotions";
const STORE_STORAGE_KEY = "super-ofertas-store";
const AUTH_STORAGE_KEY = "super-ofertas-auth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || "promotion-images";

const backendMode = supabaseUrl && supabaseAnonKey ? "supabase" : "demo";

const supabase =
  backendMode === "supabase"
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

const isBrowser = () => typeof window !== "undefined";

const readJson = (key, fallback) => {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizePromotion = (promotion) => ({
  id: promotion.id,
  name: promotion.name ?? "",
  category: promotion.category ?? "",
  description: promotion.description ?? "",
  price: Number(promotion.price ?? 0),
  originalPrice: Number(
    promotion.originalPrice ?? promotion.original_price ?? 0,
  ),
  image: promotion.image ?? "",
  active: Boolean(promotion.active),
  createdAt: promotion.createdAt ?? promotion.created_at ?? new Date().toISOString(),
});

const toSupabasePromotion = (promotion) => ({
  id: promotion.id,
  name: promotion.name.trim(),
  category: promotion.category.trim(),
  description: promotion.description.trim(),
  price: Number(promotion.price),
  original_price: Number(promotion.originalPrice || 0),
  image: promotion.image || "",
  active: Boolean(promotion.active),
});

const ensureDemoPromotions = () => {
  const promotions = readJson(PROMOTIONS_STORAGE_KEY, null);

  if (Array.isArray(promotions) && promotions.length > 0) {
    return promotions.map(normalizePromotion);
  }

  const seededPromotions = DEMO_PROMOTIONS.map(normalizePromotion);
  writeJson(PROMOTIONS_STORAGE_KEY, seededPromotions);
  return seededPromotions;
};

const ensureDemoStoreSettings = () => {
  const storeSettings = readJson(STORE_STORAGE_KEY, null);

  if (
    storeSettings &&
    typeof storeSettings.storeName === "string" &&
    typeof storeSettings.whatsappNumber === "string"
  ) {
    return {
      storeName: storeSettings.storeName,
      whatsappNumber: storeSettings.whatsappNumber,
    };
  }

  writeJson(STORE_STORAGE_KEY, DEFAULT_STORE);
  return DEFAULT_STORE;
};

const ensureDemoAuth = () => {
  const auth = readJson(AUTH_STORAGE_KEY, null);

  if (auth && typeof auth.email === "string" && typeof auth.password === "string") {
    return {
      email: auth.email,
      password: auth.password,
      isAuthenticated: Boolean(auth.isAuthenticated),
    };
  }

  const initialAuth = {
    email: DEMO_ADMIN.email,
    password: DEMO_ADMIN.password,
    isAuthenticated: false,
  };

  writeJson(AUTH_STORAGE_KEY, initialAuth);
  return initialAuth;
};

const saveDemoAuth = (auth) => {
  writeJson(AUTH_STORAGE_KEY, auth);
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result));
    };

    reader.onerror = () => {
      reject(new Error("Não foi possível ler a imagem selecionada."));
    };

    reader.readAsDataURL(file);
  });

const createDemoPromotionId = (existingIds) => {
  let nextId = "";

  do {
    nextId = `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  } while (existingIds.has(nextId));

  return nextId;
};

const getPublicImagePath = (fileName) => {
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "webp";
  const sanitizedExtension = extension?.replace(/[^a-zA-Z0-9]/g, "") || "webp";

  return `public/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${sanitizedExtension}`;
};

const uploadPromotionImage = async (imageFile) => {
  if (!imageFile) {
    return "";
  }

  if (backendMode === "demo") {
    return fileToDataUrl(imageFile);
  }

  const objectPath = getPublicImagePath(imageFile.name);
  const { error: uploadError } = await supabase.storage
    .from(supabaseBucket)
    .upload(objectPath, imageFile, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Falha ao enviar a imagem.");
  }

  const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(objectPath);
  return data.publicUrl;
};

const getSupabaseRole = async (userId) => {
  if (!supabase || !userId) {
    return "guest";
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return "viewer";
  }

  return data?.role || "viewer";
};

const ensureSupabaseStoreSettings = async () => {
  const { data, error } = await supabase
    .from("store_settings")
    .select("store_name, whatsapp_number")
    .eq("id", "main")
    .maybeSingle();

  if (!error && data) {
    return {
      storeName: data.store_name,
      whatsappNumber: data.whatsapp_number,
    };
  }

  const { error: upsertError } = await supabase.from("store_settings").upsert(
    {
      id: "main",
      store_name: DEFAULT_STORE.storeName,
      whatsapp_number: DEFAULT_STORE.whatsappNumber,
    },
    {
      onConflict: "id",
    },
  );

  if (upsertError) {
    return DEFAULT_STORE;
  }

  return DEFAULT_STORE;
};

export const getBackendMode = () => backendMode;

export const getInitialAppState = async () => {
  if (backendMode === "demo") {
    const auth = ensureDemoAuth();

    return {
      mode: backendMode,
      session: auth.isAuthenticated
        ? {
            user: {
              id: "demo-admin",
              email: auth.email,
            },
          }
        : null,
      userRole: auth.isAuthenticated ? "admin" : "guest",
      storeSettings: ensureDemoStoreSettings(),
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    mode: backendMode,
    session,
    userRole: session?.user ? await getSupabaseRole(session.user.id) : "guest",
    storeSettings: await ensureSupabaseStoreSettings(),
  };
};

export const listPublicPromotions = async () => {
  if (backendMode === "demo") {
    return ensureDemoPromotions().filter((promotion) => promotion.active);
  }

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Não foi possível carregar as promoções.");
  }

  return (data || []).map(normalizePromotion);
};

export const listAdminPromotions = async () => {
  if (backendMode === "demo") {
    return ensureDemoPromotions();
  }

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Não foi possível carregar as promoções do painel.");
  }

  return (data || []).map(normalizePromotion);
};

export const savePromotion = async (promotion, imageFile) => {
  const normalizedPromotion = normalizePromotion(promotion);

  if (backendMode === "demo") {
    const promotions = ensureDemoPromotions();
    const existingIds = new Set(promotions.map((item) => item.id));
    const existingPromotion = promotions.find((item) => item.id === normalizedPromotion.id);

    let image = normalizedPromotion.image || existingPromotion?.image || "";

    if (imageFile) {
      image = await uploadPromotionImage(imageFile);
    }

    const record = {
      ...normalizedPromotion,
      id: existingPromotion?.id || createDemoPromotionId(existingIds),
      image,
      createdAt: existingPromotion?.createdAt || new Date().toISOString(),
    };

    const nextPromotions = existingPromotion
      ? promotions.map((item) => (item.id === record.id ? record : item))
      : [record, ...promotions];

    writeJson(PROMOTIONS_STORAGE_KEY, nextPromotions);
    return record;
  }

  const image = imageFile
    ? await uploadPromotionImage(imageFile)
    : normalizedPromotion.image || "";

  const payload = {
    ...toSupabasePromotion({
      ...normalizedPromotion,
      image,
    }),
  };

  if (!normalizedPromotion.id) {
    delete payload.id;
  }

  const query = normalizedPromotion.id
    ? supabase.from("promotions").update(payload).eq("id", normalizedPromotion.id)
    : supabase.from("promotions").insert(payload);

  const { data, error } = await query.select().single();

  if (error) {
    throw new Error(error.message || "Não foi possível salvar a promoção.");
  }

  return normalizePromotion(data);
};

export const deletePromotion = async (promotionId) => {
  if (backendMode === "demo") {
    const promotions = ensureDemoPromotions();
    const nextPromotions = promotions.filter((promotion) => promotion.id !== promotionId);
    writeJson(PROMOTIONS_STORAGE_KEY, nextPromotions);
    return;
  }

  const { error } = await supabase.from("promotions").delete().eq("id", promotionId);

  if (error) {
    throw new Error(error.message || "Não foi possível excluir a promoção.");
  }
};

export const getStoreSettings = async () => {
  if (backendMode === "demo") {
    return ensureDemoStoreSettings();
  }

  return ensureSupabaseStoreSettings();
};

export const saveStoreSettings = async (settings) => {
  const nextSettings = {
    storeName: settings.storeName.trim(),
    whatsappNumber: settings.whatsappNumber.trim(),
  };

  if (backendMode === "demo") {
    writeJson(STORE_STORAGE_KEY, nextSettings);
    return nextSettings;
  }

  const { error } = await supabase.from("store_settings").upsert(
    {
      id: "main",
      store_name: nextSettings.storeName,
      whatsapp_number: nextSettings.whatsappNumber,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(error.message || "Não foi possível salvar as configurações.");
  }

  return nextSettings;
};

export const login = async (email, password) => {
  if (backendMode === "demo") {
    const auth = ensureDemoAuth();

    if (email !== auth.email || password !== auth.password) {
      throw new Error("Credenciais demo inválidas.");
    }

    const nextAuth = {
      ...auth,
      isAuthenticated: true,
    };

    saveDemoAuth(nextAuth);

    return {
      session: {
        user: {
          id: "demo-admin",
          email: auth.email,
        },
      },
      userRole: "admin",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message || "Não foi possível entrar.");
  }

  const role = await getSupabaseRole(data.user?.id);

  if (role !== "admin") {
    await supabase.auth.signOut();
    throw new Error("Acesso restrito: este usuário não possui perfil administrativo.");
  }

  return {
    session: data.session,
    userRole: role,
  };
};

export const logout = async () => {
  if (backendMode === "demo") {
    const auth = ensureDemoAuth();
    saveDemoAuth({
      ...auth,
      isAuthenticated: false,
    });
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message || "Não foi possível sair da sessão.");
  }
};

export const requestPasswordReset = async (email) => {
  if (backendMode === "demo") {
    ensureDemoAuth();

    return {
      message:
        "Modo demo: a recuperação é simulada. Use a tela de redefinição para trocar a senha local.",
    };
  }

  const redirectTo = isBrowser()
    ? `${window.location.origin}/reset-password`
    : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message || "Não foi possível enviar o e-mail de recuperação.");
  }

  return {
    message: "Enviamos um link de redefinição de senha para o e-mail informado.",
  };
};

export const updatePassword = async (password) => {
  if (backendMode === "demo") {
    const auth = ensureDemoAuth();
    saveDemoAuth({
      ...auth,
      password,
    });

    return {
      message: "Senha demo atualizada com sucesso.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw new Error(error.message || "Não foi possível atualizar a senha.");
  }

  return {
    message: "Senha atualizada com sucesso.",
  };
};

export const subscribeToAuthChanges = (listener) => {
  if (!supabase) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    Promise.resolve(getSupabaseRole(session?.user?.id)).then((userRole) => {
      listener({
        event,
        session,
        userRole: session ? userRole : "guest",
      });
    });
  });

  return () => {
    subscription.unsubscribe();
  };
};

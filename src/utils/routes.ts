export function isValidRedirectUrl(url: string): boolean {
  if (!url.startsWith("/") || url.startsWith("//")) return false;
  try {
    const parsed = new URL(url, "http://dummy");
    if (parsed.origin !== "http://dummy") return false;
  } catch {
    return false;
  }
  return true;
}

export function buildLoginUrl(redirectUrl?: string): string {
  if (!redirectUrl || !isValidRedirectUrl(redirectUrl)) {
    return routes.auth.login;
  }
  return `${routes.auth.login}?redirectUrl=${encodeURIComponent(redirectUrl)}`;
}

export function buildSetPasswordUrl(nextUrl?: string): string {
  if (!nextUrl || !isValidRedirectUrl(nextUrl)) {
    return routes.auth.setPassword;
  }
  return `${routes.auth.setPassword}?next=${encodeURIComponent(nextUrl)}`;
}

/**
 * Where to land after the password gate has been satisfied.
 *
 * Anything that fails the redirect check falls back to the dashboard rather
 * than being followed, so a crafted `next` cannot bounce someone off-site.
 */
export function safeNext(nextUrl?: string | null): string {
  if (!nextUrl || !isValidRedirectUrl(nextUrl)) {
    return routes.dashboard.root;
  }
  return nextUrl;
}

export const routes = {
  auth: {
    login: "/auth/login",
    setPassword: "/auth/set-password",
    confirm: "/auth/confirm",
    forgotPassword: "/auth/forgot-password",
  },

  dashboard: {
    root: "/",
  },
  products: {
    list: "/products/list",
    listFiltered: (params: { categoryId?: string; brandId?: string }) => {
      const query = new URLSearchParams();
      if (params.categoryId) query.set("categoryId", params.categoryId);
      if (params.brandId) query.set("brandId", params.brandId);
      const qs = query.toString();
      return qs ? `/products/list?${qs}` : "/products/list";
    },
    details: (id: string) => `/products/${id}`,
  },
  productSources: {
    list: "/product-sources/list",
    details: (id: string) => `/product-sources/${id}`,
  },
  brands: {
    list: "/brands/list",
    details: (id: string) => `/brands/${id}`,
  },
  categories: {
    list: "/categories/list",
    details: (id: string) => `/categories/${id}`,
  },
  sellers: {
    list: "/sellers/list",
    details: (id: string) => `/sellers/${id}`,
  },
  users: {
    list: "/users/list",
    details: (id: string) => `/users/${id}`,
  },
  tasks: {
    list: "/tasks/list",
  },
  scrapeTasks: {
    list: "/scrape-tasks/list",
  },
  productDuplicates: {
    list: "/product-duplicates/list",
  },
};

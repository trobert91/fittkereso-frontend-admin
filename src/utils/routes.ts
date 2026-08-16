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

export const routes = {
  auth: {
    login: "/auth/login",
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
  productDuplications: {
    list: "/product-duplications/list",
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
  tasks: {
    list: "/tasks/list",
  },
  scrapeTasks: {
    list: "/scrape-tasks/list",
  },
};

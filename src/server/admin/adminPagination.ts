export const DEFAULT_ADMIN_PAGE_SIZE = 50;
export const MAX_ADMIN_PAGE_SIZE = 100;
export const MAX_ADMIN_PAGE = 1000;

export function parseAdminLimit(value: string | null | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_ADMIN_PAGE_SIZE;
  }

  return Math.min(Math.floor(parsed), MAX_ADMIN_PAGE_SIZE);
}

export function parseAdminPage(value: string | null | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }

  return Math.min(Math.floor(parsed), MAX_ADMIN_PAGE);
}

export function getAdminPagination(searchParams: URLSearchParams) {
  return {
    limit: parseAdminLimit(searchParams.get("limit")),
    page: parseAdminPage(searchParams.get("page")),
  };
}

export function buildAdminPaginationMeta(params: {
  limit: number;
  page: number;
  returned: number;
  hasMore: boolean;
}) {
  return {
    limit: params.limit,
    page: params.page,
    returned: params.returned,
    hasMore: params.hasMore,
    nextPage: params.hasMore ? params.page + 1 : null,
  };
}

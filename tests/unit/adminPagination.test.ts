import { describe, expect, it } from "vitest";
import {
  buildAdminPaginationMeta,
  DEFAULT_ADMIN_PAGE_SIZE,
  getAdminPagination,
  MAX_ADMIN_PAGE,
  MAX_ADMIN_PAGE_SIZE,
  parseAdminLimit,
  parseAdminPage,
} from "../../src/server/admin/adminPagination";

describe("admin pagination helpers", () => {
  it("normalizes limit values", () => {
    expect(parseAdminLimit(null)).toBe(DEFAULT_ADMIN_PAGE_SIZE);
    expect(parseAdminLimit("abc")).toBe(DEFAULT_ADMIN_PAGE_SIZE);
    expect(parseAdminLimit("-1")).toBe(DEFAULT_ADMIN_PAGE_SIZE);
    expect(parseAdminLimit("20")).toBe(20);
    expect(parseAdminLimit("20.9")).toBe(20);
    expect(parseAdminLimit("500")).toBe(MAX_ADMIN_PAGE_SIZE);
  });

  it("normalizes page values", () => {
    expect(parseAdminPage(null)).toBe(1);
    expect(parseAdminPage("abc")).toBe(1);
    expect(parseAdminPage("-5")).toBe(1);
    expect(parseAdminPage("3")).toBe(3);
    expect(parseAdminPage("3.8")).toBe(3);
    expect(parseAdminPage("5000")).toBe(MAX_ADMIN_PAGE);
  });

  it("extracts pagination from URLSearchParams", () => {
    const pagination = getAdminPagination(new URLSearchParams("limit=25&page=4"));
    expect(pagination).toEqual({ limit: 25, page: 4 });
  });

  it("builds next page metadata without total counts", () => {
    expect(buildAdminPaginationMeta({ limit: 50, page: 2, returned: 50, hasMore: true })).toEqual({
      limit: 50,
      page: 2,
      returned: 50,
      hasMore: true,
      nextPage: 3,
    });

    expect(buildAdminPaginationMeta({ limit: 50, page: 2, returned: 10, hasMore: false }).nextPage).toBeNull();
  });
});

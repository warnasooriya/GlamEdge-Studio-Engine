export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function parsePagination(
  query: Record<string, unknown>,
  defaultPageSize = 20,
  maxPageSize = 100
): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(String(query.pageSize ?? defaultPageSize), 10) || defaultPageSize)
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginationMeta(total: number, page: number, pageSize: number) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Keep chat cards bounded without losing selections between pages. */
export function paginateCatalog<T>(items: readonly T[], page: number, size: number) {
  const pageSize = Math.max(1, Math.floor(size));
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.max(0, Math.min(Math.floor(page), totalPages - 1));
  const start = currentPage * pageSize;
  return { items: items.slice(start, start + pageSize), currentPage, totalPages, start };
}

export function addVisibleSelection(current: ReadonlySet<string>, ids: readonly string[]) {
  return new Set([...current, ...ids]);
}

/**
 * Standard paginated list response shape returned by all list endpoints.
 *
 * @example
 * {
 *   data: [ { id: '...', name: 'Yangon Branch' }, ... ],
 *   meta: { total: 42, page: 1, limit: 10, totalPages: 5 }
 * }
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Pagination query parameters typically extracted from a query DTO.
 * Both fields are optional so callers can pass the raw DTO directly.
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Wraps a Prisma `findMany` result and its total count into the project's
 * standard paginated response object.
 *
 * **Usage in a service:**
 * ```ts
 * import { formatList } from '../../shared/utils';
 *
 * async findAll(query: BranchQueryDto): Promise<PaginatedResponse<Branch>> {
 *   const [items, total] = await Promise.all([
 *     this.prisma.branch.findMany({ where, skip, take }),
 *     this.prisma.branch.count({ where }),
 *   ]);
 *
 *   return formatList(items, total, query);
 * }
 * ```
 *
 * @param items  - The array returned by `prisma.[model].findMany()`
 * @param total  - The total record count returned by `prisma.[model].count()`
 * @param query  - An object with optional `page` and `limit` (defaults: 1 / 10)
 * @param transform - Optional mapper applied to every item before wrapping.
 *                    Useful for converting Prisma `Decimal` fields to `number`.
 * @returns      A `PaginatedResponse<T>` ready to be returned from the controller
 */
export function formatList<TRaw, TOut = TRaw>(
  items: TRaw[],
  total: number,
  query: PaginationQuery = {},
  transform?: (item: TRaw) => TOut,
): PaginatedResponse<TOut> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  const data: TOut[] = transform ? items.map(transform) : (items as unknown as TOut[]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

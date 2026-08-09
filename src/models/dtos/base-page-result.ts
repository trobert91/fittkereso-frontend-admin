export interface BasePageResult<T> {
  page?: number;

  pageSize?: number;

  totalItems?: number;

  totalPages?: number;

  items?: T[];

  sort?: string;

  order?: "ASC" | "DESC";
}

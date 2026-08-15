"use client";
"use no memo";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  Loader,
  Center,
  Pagination,
  Text,
  Box,
  Badge,
  ActionIcon,
  Group,
  Stack,
  MultiSelect,
  TextInput,
  CloseButton,
  Card,
  Button,
} from "@mantine/core";
import { ProductModel } from "@/models/product-model";
import { ProductSearchParams } from "@/models/dtos/product-search-models";
import { useProductSearch } from "@/hooks/useProductSearch";
import { isEmpty } from "lodash";
import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { LuExternalLink } from "react-icons/lu";
import { ProductSpecsBadges } from "@/components/product/product-specs-badges";
import { ProductCategory } from "@/models/product-category";
import { postCategorySearch } from "@/api-actions/category/category-search";
import { Brand } from "@/models/brand";
import debounce from "lodash/debounce";
import { postBrandSearch } from "@/api-actions/brand/brand-search";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface ProductTableProps {
  onSelectProduct?: (product: ProductModel) => void;
  showProductDetailsLink?: boolean;
  initialSearchTerm?: string;
  initialCategoryId?: string;
  initialBrandId?: string;
  syncWithUrl?: boolean;
}

export function ProductTable({
  onSelectProduct,
  showProductDetailsLink = true,
  initialSearchTerm = "",
  initialBrandId,
  initialCategoryId,
  syncWithUrl = false,
}: ProductTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const resolveInitialCategories = (): string[] => {
    if (syncWithUrl) {
      const fromUrl = searchParams.getAll("categoryId");
      if (fromUrl.length) return fromUrl;
    }
    return initialCategoryId ? [initialCategoryId] : [];
  };

  const resolveInitialBrands = (): string[] => {
    if (syncWithUrl) {
      const fromUrl = searchParams.getAll("brandId");
      if (fromUrl.length) return fromUrl;
    }
    return initialBrandId ? [initialBrandId] : [];
  };

  const resolveInitialSearch = (): string => {
    if (syncWithUrl) {
      return searchParams.get("search") ?? initialSearchTerm;
    }
    return initialSearchTerm;
  };

  const [data, setData] = useState<ProductModel[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string[]>(resolveInitialCategories);
  const [brandFilter, setBrandFilter] = useState<string[]>(resolveInitialBrands);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(resolveInitialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState(resolveInitialSearch);

  // Sync filter state to URL query params
  const syncFiltersToUrl = useCallback(
    (params: { categories: string[]; brands: string[]; search: string }) => {
      if (!syncWithUrl) return;
      const query = new URLSearchParams();
      params.categories.forEach((id) => query.append("categoryId", id));
      params.brands.forEach((id) => query.append("brandId", id));
      if (params.search) query.set("search", params.search);
      const qs = query.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [syncWithUrl, pathname, router]
  );

  // TanStack sorting state
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const { searchProducts, loading, searchResult, error } = useProductSearch();
  const columnHelper = useMemo(() => createColumnHelper<ProductModel>(), []);

  // Debounced setter for search term (used for backend query)
  const setDebouncedSearchTermDebounced = useMemo(
    () =>
      debounce((val: string) => {
        setPage(1);
        setDebouncedSearchTerm(val);
        syncFiltersToUrl({ categories: categoryFilter, brands: brandFilter, search: val });
      }, 1000),
    [syncFiltersToUrl, categoryFilter, brandFilter]
  );

  useEffect(() => {
    return () => {
      setDebouncedSearchTermDebounced.cancel();
    };
  }, [setDebouncedSearchTermDebounced]);

  // Fetch top 50 categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await postCategorySearch({ page: 1, pageSize: 500 });
        setCategories(result.items || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchBrands = async () => {
      try {
        const result = await postBrandSearch({ page: 1, pageSize: 500 });
        setBrands(result.items || []);
      } catch (err) {
        console.error("Failed to fetch brands:", err);
      } finally {
        setBrandsLoading(false);
      }
    };

    fetchCategories();
    fetchBrands();
  }, []);

  // Ensure any preselected filter IDs (e.g. from URL query params) are present
  // in the MultiSelect options, so the labels render correctly instead of the raw UUID.
  useEffect(() => {
    if (categoriesLoading) return;
    const missingIds = categoryFilter.filter(
      (id) => !categories.some((c) => c.id === id)
    );
    if (isEmpty(missingIds)) return;

    Promise.all(missingIds.map((id) => getCategoryById(id).catch(() => null)))
      .then((fetched) => {
        const resolved = compact(fetched);
        if (!isEmpty(resolved)) {
          setCategories((prev) => [...prev, ...resolved]);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesLoading]);

  useEffect(() => {
    if (brandsLoading) return;
    const missingIds = brandFilter.filter(
      (id) => !brands.some((b) => b.id === id)
    );
    if (isEmpty(missingIds)) return;

    Promise.all(missingIds.map((id) => getBrandById(id).catch(() => null)))
      .then((fetched) => {
        const resolved = compact(fetched);
        if (!isEmpty(resolved)) {
          setBrands((prev) => [...prev, ...resolved]);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsLoading]);

  useEffect(() => {
    setData(searchResult?.items || []);
    setTotalPages(searchResult?.totalPages || 1);
  }, [searchResult]);
  // Search whenever any filter/sort/page param changes
  useEffect(() => {
    if (!pageSize || !page) {
      return;
    }

    const sortField = sorting[0]?.id as ProductSearchParams["sort"];
    const sortOrder =
      sorting[0]?.desc === true ? "DESC" : sorting.length ? "ASC" : undefined;

    const searchParams: ProductSearchParams = {
      page,
      pageSize,
      sort: sortField,
      order: sortOrder,
      categoryIds: categoryFilter.length ? categoryFilter : undefined,
      brandIds: brandFilter.length ? brandFilter : undefined,
      searchTerm: debouncedSearchTerm || undefined,
      includeImages: false,
    };

    searchProducts(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    sorting,
    pageSize,
    categoryFilter,
    brandFilter,
    debouncedSearchTerm,
  ]);

  //
  // Column definitions
  //
  const columns = useMemo(
    () => [
      columnHelper.group({
        id: "productInfo",
        header: "Product Info",
        columns: [
          columnHelper.accessor("mainImage", {
            header: () => "Image",
            enableSorting: false,
            cell: (props) => {
              const image = props.getValue();
              if (!image) {
                return null;
              }

              const row = props.row.original; // full row data
              const id = row.id; // access the product id

              return (
                <Box pos="relative" w={120} style={{ aspectRatio: "3 / 4" }}>
                  <Link href={routes.products.details(id)}>
                    <Image
                      src={image.url}
                      alt="Product Image"
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  </Link>
                </Box>
              );
            },
          }),
          columnHelper.accessor("displayName", {
            id: "displayName",
            header: ({ column }) => (
              <Text
                fw={500}
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
                style={{ cursor: "pointer" }}
              >
                Name
              </Text>
            ),
            cell: (props) => {
              const displayName = props.getValue();
              const row = props.row.original;
              const id = row.id;

              return (
                <Text size="sm">
                  {displayName}{" "}
                  {showProductDetailsLink && (
                    <Link href={routes.products.details(id)}>
                      <ActionIcon
                        variant="transparent"
                        aria-label="Go to details"
                      >
                        <LuExternalLink
                          style={{ width: "15px", height: "70%" }}
                        />
                      </ActionIcon>
                    </Link>
                  )}
                  {onSelectProduct && (
                    <Button
                      size="xs"
                      ml="sm"
                      onClick={() => onSelectProduct(row)}
                    >
                      Select
                    </Button>
                  )}
                </Text>
              );
            },
          }),

          columnHelper.accessor((row) => row.brand?.name, {
            id: "brand.name",
            header: () => "Brand",
            cell: (props) => props.getValue(),
          }),

          columnHelper.accessor((row) => row.productCategory?.name, {
            id: "productCategory.name",
            header: () => "Category",
            enableSorting: false,
            cell: (props) => {
              const name = props.getValue();
              return name ? (
                <Badge variant="light" color="blue" tt="none">
                  {name}
                </Badge>
              ) : null;
            },
          }),
        ],
      }),

      columnHelper.accessor((row) => row, {
        id: "alerts",
        header: () => "",
        cell: (props) => {
          const row = props.getValue();

          if (!row.specValid) {
            return (
              <Badge color="red" variant="light">
                Spec Errors
              </Badge>
            );
          }

          return null;
        },
      }),

      columnHelper.accessor("orderedSpecs", {
        id: "orderedSpecs",
        header: "Specs",
        enableSorting: false,
        maxSize: 500,
        cell: ({ getValue }) => <ProductSpecsBadges specs={getValue()} />,
      }),

      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Created
          </Text>
        ),
        cell: (props) => {
          const date = new Date(props.getValue() as string);
          return format(date, "yyyy-MM-dd HH:mm:ss");
        },
      }),

      columnHelper.accessor("updatedAt", {
        id: "updatedAt",
        header: ({ column }) => (
          <Text
            fw={500}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            style={{ cursor: "pointer" }}
          >
            Updated
          </Text>
        ),
        cell: (props) => {
          const date = new Date(props.getValue() as string);
          return format(date, "yyyy-MM-dd HH:mm:ss");
        },
      }),
    ],
    [columnHelper]
  );

  //
  // TanStack table instance
  //
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // sorting displayed, NOT backend sort logic
    manualSorting: true, // important for backend sort
    manualPagination: true,
  });

  return (
    <>
      {loading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : (
        <>
          <Card shadow="sm" padding="sm" radius="sm" mb="xl" withBorder>
            <Group justify="space-between" mb="sm">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Group gap="md">
                  <MultiSelect
                    label="Filter by category"
                    placeholder="Select categories"
                    data={categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    value={categoryFilter}
                    onChange={(vals) => {
                      setCategoryFilter(vals);
                      syncFiltersToUrl({ categories: vals, brands: brandFilter, search: debouncedSearchTerm });
                    }}
                    clearable
                    searchable
                    disabled={categoriesLoading}
                    maw={300}
                  />
                  <MultiSelect
                    label="Filter by brand"
                    placeholder="Select brands"
                    data={brands.map((b) => ({ value: b.id, label: b.name }))}
                    value={brandFilter}
                    onChange={(vals) => {
                      setBrandFilter(vals);
                      syncFiltersToUrl({ categories: categoryFilter, brands: vals, search: debouncedSearchTerm });
                    }}
                    clearable
                    searchable
                    disabled={brandsLoading}
                    maw={300}
                  />
                  <TextInput
                    label="Search"
                    placeholder="Search products"
                    value={searchTerm}
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      setSearchTerm(val);
                      setDebouncedSearchTermDebounced(val);
                    }}
                    rightSection={
                      searchTerm && (
                        <CloseButton
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                            setDebouncedSearchTermDebounced("");
                          }}
                        />
                      )
                    }
                    maw={300}
                  />
                </Group>
              </Stack>
            </Group>
          </Card>
          <Table striped horizontalSpacing="md" verticalSpacing="md">
            <Table.Thead>
              {table.getHeaderGroups().map((hg) => (
                <Table.Tr key={hg.id}>
                  {hg.headers.map((header) => {
                    if (header.isPlaceholder) return <th key={header.id}></th>;

                    const column = header.column;
                    const sorted = column.getIsSorted();
                    const canSort = column.getCanSort();

                    return (
                      <th
                        key={header.id}
                        {...(canSort
                          ? {
                              onClick: column.getToggleSortingHandler(),
                              style: { cursor: "pointer" },
                            }
                          : {})}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {flexRender(
                            column.columnDef.header,
                            header.getContext()
                          )}

                          {canSort && sorted === "asc" && "▲"}
                          {canSort && sorted === "desc" && "▼"}
                        </div>
                      </th>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Thead>

            <Table.Tbody>
              {isEmpty(table.getRowModel().rows) ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Center>No products found</Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>

          <Center mt="md">
            <Pagination
              total={totalPages}
              value={page}
              onChange={setPage}
              size="md"
            />
          </Center>
        </>
      )}
    </>
  );
}

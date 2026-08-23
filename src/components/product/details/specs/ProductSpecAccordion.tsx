import { SpecDefinitionJsonSchema } from "@/models/product-specs";
import {
  Alert,
  Anchor,
  Button,
  Card,
  SimpleGrid,
  Stack,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import JsonView from "@uiw/react-json-view";
import { darkTheme } from "@uiw/react-json-view/dark";
import { lightTheme } from "@uiw/react-json-view/light";
import { groupBy, maxBy } from "lodash";
import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch } from "@/store/store-hooks";
import {
  selectManualSpecs,
  selectProductError,
  selectProductSaveInProgress,
  setManualSpecs,
  updateProductManualSpecs,
} from "@/store/slices/product-slice";
import { useSelector } from "react-redux";
import { IoMdAlert } from "react-icons/io";
import { ProductModel } from "@/models/product-model";
import { JsonEditor } from "@/components/JsonEditor";
import { notifications } from "@mantine/notifications";

export const ProductSpecAccordion: React.FC<{
  product: ProductModel;
  schema: SpecDefinitionJsonSchema | undefined;
}> = ({ product, schema }) => {
  const { specs, sources = [], specValid, specErrors } = product;

  const dispatch = useAppDispatch();
  const { colorScheme } = useMantineColorScheme();

  const manualSpecs = useSelector(selectManualSpecs);
  const saveInProgress = useSelector(selectProductSaveInProgress);
  const error = useSelector(selectProductError);

  const themeStyle = ["dark", "auto"].includes(colorScheme)
    ? darkTheme
    : lightTheme;

  const filteredSources = useMemo(() => {
    // Manual (admin-entered) specs have no linked source — see
    // product-spec-updater.service.ts on the backend.
    return sources.filter((s) => s.source);
  }, [sources]);

  const groupedSources = useMemo(() => {
    return groupBy(filteredSources, (s) => s.source?.name ?? "Unknown source");
  }, [filteredSources]);

  const handleJsonChange = useCallback(
    (val: string) => {
      try {
        const parsed = JSON.parse(val);
        dispatch(setManualSpecs(parsed));
      } catch (e) {
        // ignore parse errors here
      }
    },
    [dispatch]
  );

  const submitManualSpecs = useCallback(async () => {
    if (!product.id) return;

    try {
      await dispatch(
        updateProductManualSpecs({
          id: product.id,
          data: {
            specs: manualSpecs ?? {},
          },
        })
      ).unwrap();

      notifications.show({
        title: "Success",
        message: "Product specifications updated successfully.",
        color: "green",
        position: "top-right",
      });
    } catch {
      // Error is surfaced via the effect below.
    }
  }, [dispatch, product.id, manualSpecs]);

  useEffect(() => {
    if (error) {
      notifications.show({
        title: "Error",
        message: error,
        color: "red",
        position: "top-right",
      });
    }
  }, [error]);

  return (
    <Stack gap="lg">
      {(manualSpecs || specs || Object.keys(groupedSources).length > 0) && (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
          {manualSpecs && (
            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Text fw={700} size="sm">
                  Manual Specs
                </Text>

                <JsonEditor
                  value={
                    manualSpecs ? JSON.stringify(manualSpecs, null, 2) : ""
                  }
                  compact={false}
                  onChange={handleJsonChange}
                  schema={schema}
                />

                <Button
                  fullWidth
                  loading={saveInProgress}
                  size="md"
                  onClick={submitManualSpecs}
                >
                  Save
                </Button>
              </Stack>
            </Card>
          )}

          {specs && (
            <Card withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Text fw={700} size="sm">
                  Final Specs
                </Text>

                {!specValid && (
                  <Alert variant="light" color="red" icon={<IoMdAlert />}>
                    {JSON.stringify(specErrors, null, 2)}
                  </Alert>
                )}

                <JsonView
                  value={specs}
                  collapsed={false}
                  style={themeStyle}
                  objectSortKeys={true}
                />
              </Stack>
            </Card>
          )}

          {Object.entries(groupedSources).map(([sourceName, entries]) => {
            const latest = maxBy(entries, (e) => e.lastUpdated)!;
            return (
              <Card key={sourceName} withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Text fw={700} size="sm">
                    {sourceName}
                  </Text>

                  {entries
                    .filter((e) => e.url)
                    .map((e) => (
                      <Anchor
                        key={e.id}
                        href={e.url!}
                        target="_blank"
                        size="sm"
                        display="block"
                      >
                        {e.url}
                      </Anchor>
                    ))}

                  {!latest.specValid && (
                    <Alert variant="light" color="red" icon={<IoMdAlert />}>
                      {JSON.stringify(latest.specErrors, null, 2)}
                    </Alert>
                  )}

                  {latest.scrapedProduct?.specs && (
                    <JsonView
                      value={latest.scrapedProduct.specs}
                      collapsed={false}
                      style={themeStyle}
                      objectSortKeys={true}
                    />
                  )}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
};

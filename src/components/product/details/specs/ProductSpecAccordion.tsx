import { ProductSourceType } from "@/models/product-source";
import { SpecDefinitionJsonSchema } from "@/models/product-specs";
import { Accordion, Alert, Anchor, useMantineColorScheme } from "@mantine/core";
import JsonView from "@uiw/react-json-view";
import { darkTheme } from "@uiw/react-json-view/dark";
import { lightTheme } from "@uiw/react-json-view/light";
import { groupBy, head, maxBy } from "lodash";
import { useCallback, useMemo } from "react";
import { useAppDispatch } from "@/store/store-hooks";
import {
  selectManualSpecs,
  setManualSpecs,
} from "@/store/slices/product-slice";
import { useSelector } from "react-redux";
import { IoMdAlert } from "react-icons/io";
import { ProductModel } from "@/models/product-model";
import { JsonEditor } from "@/components/JsonEditor";

export const ProductSpecAccordion: React.FC<{
  product: ProductModel;
  schema: SpecDefinitionJsonSchema | undefined;
}> = ({ product, schema }) => {
  const { specs, sources = [], specValid, specErrors } = product;

  const dispatch = useAppDispatch();
  const { colorScheme } = useMantineColorScheme();

  const manualSpecs = useSelector(selectManualSpecs);

  const themeStyle = ["dark", "auto"].includes(colorScheme)
    ? darkTheme
    : lightTheme;

  const defaultValue = useMemo(() => {
    const first = head(sources);
    if (!first) {
      return undefined;
    }

    return [first.type];
  }, [sources]);

  const filteredSources = useMemo(() => {
    return sources.filter((s) => s.type !== ProductSourceType.manual);
  }, [sources]);

  const groupedSources = useMemo(() => {
    return groupBy(filteredSources, (s) => s.type);
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

  return (
    <Accordion multiple defaultValue={defaultValue} variant="separated">
      {manualSpecs && (
        <Accordion.Item value="manualSpecs">
          <Accordion.Control>Manual Specs</Accordion.Control>
          <Accordion.Panel>
            <JsonEditor
              value={manualSpecs ? JSON.stringify(manualSpecs, null, 2) : ""}
              compact={false}
              onChange={handleJsonChange}
              schema={schema}
            />
          </Accordion.Panel>
        </Accordion.Item>
      )}

      {specs && (
        <Accordion.Item value="combinedSpecs">
          <Accordion.Control>Final Specs</Accordion.Control>
          <Accordion.Panel>
            {!specValid && (
              <Alert variant="light" color="red" icon={<IoMdAlert />} mb="md">
                {JSON.stringify(specErrors, null, 2)}
              </Alert>
            )}

            <JsonView
              value={specs}
              collapsed={false}
              style={themeStyle}
              objectSortKeys={true}
            />
          </Accordion.Panel>
        </Accordion.Item>
      )}

      {Object.entries(groupedSources).map(([type, entries]) => {
        const latest = maxBy(entries, (e) => e.lastUpdated)!;
        return (
          <Accordion.Item key={type} value={type}>
            <Accordion.Control>{type}</Accordion.Control>
            <Accordion.Panel>
              {entries
                .filter((e) => e.url)
                .map((e) => (
                  <Anchor
                    key={e.id}
                    href={e.url!}
                    target="_blank"
                    size="sm"
                    display="block"
                    mb={4}
                  >
                    {e.url}
                  </Anchor>
                ))}

              {!latest.specValid && (
                <Alert
                  variant="light"
                  color="red"
                  icon={<IoMdAlert />}
                  mb="md"
                >
                  {JSON.stringify(latest.specErrors, null, 2)}
                </Alert>
              )}

              <JsonView
                value={latest.specs}
                collapsed={false}
                style={themeStyle}
                objectSortKeys={true}
              />
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

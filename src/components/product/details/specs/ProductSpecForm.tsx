import React, { useCallback, useEffect, useMemo } from "react";
import {
  SpecDefinitionJsonSchema,
  SpecDefinitionUiSchema,
} from "@/models/product-specs";
import { Button, LoadingOverlay, Stack } from "@mantine/core";
import Form from "@rjsf/mantine";
import validator from "@rjsf/validator-ajv8";
import debounce from "lodash/debounce";
import { RegistryWidgetsType } from "@rjsf/utils";
import { CustomNumberInput } from "./CustomNumberInput";
import { CustomTextInput } from "./CustomTextInput";
import {
  selectManualSpecs,
  selectProduct,
  selectProductError,
  selectProductSaveInProgress,
  setManualSpecs,
  updateProductManualSpecs,
} from "@/store/slices/product-slice";
import { useAppDispatch } from "@/store/store-hooks";
import _ from "lodash";

import { useSelector } from "react-redux";
import { CustomSelectInput } from "./CustomSelectInput";
import { notifications } from "@mantine/notifications";

const widgets: RegistryWidgetsType = {
  UpDownWidget: CustomNumberInput,
  NumberWidget: CustomNumberInput,
  TextWidget: CustomTextInput,
  SelectWidget: CustomSelectInput,
};

export function getDefaultFormDataFromSchema(
  schema: SpecDefinitionJsonSchema | undefined
): Record<string, any> {
  const props = schema?.properties ?? {};

  return _.mapValues(props, (def) => {
    switch (def.type) {
      case "string":
      case "number":
        return "";
      case "boolean":
        return undefined;
      case "array":
        return [];
      case "object":
        return {};
      default:
        return "";
    }
  });
}

const isMeaningful = (v: any) => {
  if (v === null || v === undefined) return false;
  if (typeof v === "number" || typeof v === "boolean") return true;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
};

export const ProductSpecForm: React.FC<{
  jsonSchema: SpecDefinitionJsonSchema;
  uiSchema: SpecDefinitionUiSchema;
}> = ({ jsonSchema, uiSchema }) => {
  const dispatch = useAppDispatch();
  const product = useSelector(selectProduct);
  const manualSpecs = useSelector(selectManualSpecs);
  const saveInProgress = useSelector(selectProductSaveInProgress);
  const error = useSelector(selectProductError);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const defaultValues = useMemo(
    () => getDefaultFormDataFromSchema(product?.productCategory?.jsonSchema),
    [product?.productCategory?.jsonSchema]
  );

  const setFormAndManualSpecs = useCallback(
    (specs: Record<string, any>) => {
      // Sort keys alphabetically
      const sortedSpecs = _.chain(specs)
        .pickBy((value) => isMeaningful(value)) // Use pickBy instead of filter on entries
        .toPairs()
        .sortBy(([key]) => key.toLowerCase())
        .fromPairs()
        .value();

      setFormData({ ...defaultValues, ...sortedSpecs });

      dispatch(setManualSpecs(sortedSpecs));
    },
    [dispatch, defaultValues]
  );

  useEffect(() => {
    if (manualSpecs) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ ...defaultValues, ...manualSpecs });
    }
  }, [manualSpecs, defaultValues]);

  // Debounce onChange by 500ms
  const debouncedOnChange = useMemo(
    () =>
      setFormAndManualSpecs
        ? debounce((data: any) => setFormAndManualSpecs(data), 600)
        : undefined,
    [setFormAndManualSpecs]
  );

  useEffect(() => {
    const manual =
      product?.sources?.find((s) => !s.source)?.scrapedProduct?.specs || {};

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormAndManualSpecs(manual);
  }, [
    product?.productCategory?.jsonSchema,
    product?.sources,
    setFormAndManualSpecs,
  ]);

  const submitForm = useCallback(async () => {
    const id = product?.id;
    if (!id) return;

    try {
      await dispatch(
        updateProductManualSpecs({
          id,
          data: {
            specs: formData,
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
      // Error is surfaced via the selectProductError effect below.
    }
  }, [dispatch, product?.id, formData]);

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

  if (!manualSpecs) {
    return <LoadingOverlay visible />;
  }

  return (
    <Stack gap="md" maw={800} pos="relative">
      <Form
        schema={jsonSchema}
        uiSchema={uiSchema}
        formData={formData}
        onChange={(e) => debouncedOnChange?.(e.formData)}
        validator={validator}
        widgets={widgets}
      >
        <div />
      </Form>

      {/* Sticky Save Button */}
      <div
        style={{
          position: "sticky",
          bottom: 16,
          zIndex: 3000,
          marginTop: 400,
        }}
      >
        <Button
          fullWidth
          loading={saveInProgress}
          size="md"
          onClick={submitForm}
        >
          Save
        </Button>
      </div>
    </Stack>
  );
};

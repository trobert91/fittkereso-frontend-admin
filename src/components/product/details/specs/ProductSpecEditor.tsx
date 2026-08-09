import React from "react";
import { SimpleGrid } from "@mantine/core";
import { ProductSpecAccordion } from "./ProductSpecAccordion";
import { ProductModel } from "@/models/product-model";
import { ProductSpecForm } from "./ProductSpecForm";
import { SpecDefinitionJsonSchema } from "@/models/product-specs";
import { mapValues } from "lodash";

export function getDefaultFormDataFromSchema(
  schema: SpecDefinitionJsonSchema | undefined
): Record<string, any> {
  const props = schema?.properties ?? {};

  return mapValues(props, (def) => {
    switch (def.type) {
      case "string":
      case "number":
        return "";
      case "boolean":
        return false;
      case "array":
        return [];
      case "object":
        return {};
      default:
        return "";
    }
  });
}

export const ProductSpecEditor: React.FC<{ product: ProductModel }> = ({
  product,
}) => {
  const schema = product.productCategory.jsonSchema;

  if (!schema) {
    return (
      <div>No specification schema defined for this product category.</div>
    );
  }
  if (!product.productCategory.uiSchema) {
    return <div>No UI schema defined for this product category.</div>;
  }

  return (
    <SimpleGrid cols={2} spacing="lg">
      <ProductSpecAccordion product={product} schema={schema} />

      <ProductSpecForm
        jsonSchema={schema}
        uiSchema={product.productCategory.uiSchema}
      />
    </SimpleGrid>
  );
};

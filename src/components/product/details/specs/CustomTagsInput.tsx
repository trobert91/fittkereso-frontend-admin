"use client";

import { TagsInput } from "@mantine/core";
import { WidgetProps } from "@rjsf/utils";
import { useMemo } from "react";

// TODO: implement when needed

export const CustomTagsInput = function (props: WidgetProps) {
  const { schema, uiSchema, label, placeholder, value, onChange } = props;

  const description = useMemo(() => {
    return [
      schema?.description,
      uiSchema?.["ui:description"],
      schema?.meta?.examples
        ? `examples: ${schema.meta.examples.join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join(" ");
  }, [
    schema?.description,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    uiSchema?.["ui:description"],
    schema?.meta?.examples,
  ]);

  const rightSection = useMemo(() => {
    return schema?.meta?.unit ? (
      <span style={{ marginRight: 8 }}>{schema.meta.unit}</span>
    ) : null;
  }, [schema?.meta?.unit]);

  return (
    <TagsInput
      label={label}
      description={description}
      placeholder={placeholder}
      value={value ?? ""}
      rightSection={rightSection}
      onChange={(val) => onChange(val ?? "")}
    />
  );
};

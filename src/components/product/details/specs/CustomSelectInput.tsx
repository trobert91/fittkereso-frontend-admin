"use client";

import { WidgetProps } from "@rjsf/utils";
import { isEmpty } from "lodash";
import { useMemo } from "react";
import Select from "react-select";
import { Text, useMantineColorScheme } from "@mantine/core";

export const CustomSelectInput = function (props: WidgetProps) {
  const { schema, uiSchema, label, multiple, placeholder, value, onChange } =
    props;
  const { colorScheme } = useMantineColorScheme();

  const styles = useMemo(() => {
    const isDark = ["dark", "auto"].includes(colorScheme);
    const bg = isDark ? "#1A1B1E" : "#FFFFFF";
    const border = isDark ? "#373A40" : "#CED4DA";
    const borderHover = isDark ? "#5C5F66" : "#868E96";
    const text = isDark ? "#E9ECEF" : "#212529";
    const placeholderColor = isDark ? "#868E96" : "#ADB5BD";
    const optionBgHover = isDark ? "#2C2E33" : "#F1F3F5";
    const optionBgSelected = isDark ? "#364FC7" : "#4C6EF5";
    const optionTextSelected = "#FFFFFF";

    return {
      control: (base: any, state: { isFocused: any }) => ({
        ...base,
        backgroundColor: bg,
        borderColor: state.isFocused ? borderHover : border,
        color: text,
        boxShadow: state.isFocused ? `0 0 0 1px ${borderHover}` : "none",
        "&:hover": {
          borderColor: borderHover,
        },
      }),

      menu: (base: any) => ({
        ...base,
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
      }),

      singleValue: (base: any) => ({
        ...base,
        color: text,
      }),

      placeholder: (base: any) => ({
        ...base,
        color: placeholderColor,
      }),

      input: (base: any) => ({
        ...base,
        color: text,
      }),

      option: (base: any, state: { isSelected: any; isFocused: any }) => ({
        ...base,
        backgroundColor: state.isSelected
          ? optionBgSelected
          : state.isFocused
          ? optionBgHover
          : "transparent",
        color: state.isSelected ? optionTextSelected : text,
        cursor: "pointer",
      }),

      multiValue: (base: any) => ({
        ...base,
        backgroundColor: isDark ? "#2C2E33" : "#E7F5FF",
        color: text,
      }),

      multiValueLabel: (base: any) => ({
        ...base,
        color: text,
      }),

      multiValueRemove: (base: any) => ({
        ...base,
        color: text,
        ":hover": {
          backgroundColor: optionBgHover,
          color: text,
        },
      }),
    };
  }, [colorScheme]);

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

  const options = useMemo(() => {
    const enumValues = schema.enum ?? (schema.items as any)?.enum ?? [];
    return enumValues.map((opt: any) => ({
      value: opt,
      label: opt,
    }));
  }, [schema]);

  if (isEmpty(options)) {
    return null;
  }

  return (
    <>
      <Text>{label}</Text>
      <Text size="sm">{description}</Text>
      <Select
        placeholder={placeholder}
        options={options}
        isMulti={multiple}
        value={
          multiple
            ? (value ?? []).map((v: string) => ({ value: v, label: v }))
            : value
            ? { value, label: value }
            : null
        }
        onChange={(selected) => {
          if (multiple) {
            onChange(selected ? selected.map((s: any) => s.value) : []);
          } else {
            onChange(selected ? selected.value : undefined);
          }
        }}
        styles={styles}
        isSearchable={true}
        isClearable={true}
      />
    </>
  );
};

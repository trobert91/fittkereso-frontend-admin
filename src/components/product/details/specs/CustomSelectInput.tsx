"use client";

import { WidgetProps } from "@rjsf/utils";
import { isEmpty } from "lodash";
import { useMemo } from "react";
import Select from "react-select";
import { Text } from "@mantine/core";

/**
 * react-select, dressed in Mantine's own CSS variables.
 *
 * This used to branch in JavaScript on useMantineColorScheme() and pick from a hand-copied
 * table of Mantine hex values. That was wrong twice over: the hook returns the stored CHOICE
 * rather than the resolved scheme, so "auto" - the default - was treated as dark and rendered
 * a dark control on a light page; and the hexes were a snapshot of stock Mantine, so the
 * control kept the old palette after the theme was rewritten.
 *
 * CSS variables fix both at once. They are resolved by the browser against whatever scheme is
 * actually in force, so there is nothing to branch on and nothing to keep in sync.
 */
const SELECT_STYLES = {
  control: (base: any, state: { isFocused: boolean }) => ({
    ...base,
    backgroundColor: "var(--mantine-color-body)",
    borderColor: state.isFocused
      ? "var(--mantine-primary-color-filled)"
      : "var(--mantine-color-default-border)",
    color: "var(--mantine-color-text)",
    borderRadius: "var(--mantine-radius-default)",
    boxShadow: state.isFocused
      ? "0 0 0 1px var(--mantine-primary-color-filled)"
      : "none",
    "&:hover": {
      borderColor: "var(--mantine-color-placeholder)",
    },
  }),

  menu: (base: any) => ({
    ...base,
    backgroundColor: "var(--mantine-color-body)",
    color: "var(--mantine-color-text)",
    border: "1px solid var(--mantine-color-default-border)",
    borderRadius: "var(--mantine-radius-default)",
  }),

  singleValue: (base: any) => ({
    ...base,
    color: "var(--mantine-color-text)",
  }),

  placeholder: (base: any) => ({
    ...base,
    color: "var(--mantine-color-placeholder)",
  }),

  input: (base: any) => ({
    ...base,
    color: "var(--mantine-color-text)",
  }),

  option: (base: any, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--mantine-primary-color-filled)"
      : state.isFocused
      ? "var(--mantine-color-default-hover)"
      : "transparent",
    color: state.isSelected
      ? "var(--mantine-primary-color-contrast)"
      : "var(--mantine-color-text)",
    cursor: "pointer",
  }),

  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "var(--mantine-color-default-hover)",
    borderRadius: "var(--mantine-radius-sm)",
  }),

  multiValueLabel: (base: any) => ({
    ...base,
    color: "var(--mantine-color-text)",
  }),

  multiValueRemove: (base: any) => ({
    ...base,
    color: "var(--mantine-color-dimmed)",
    ":hover": {
      backgroundColor: "var(--mantine-color-red-light)",
      color: "var(--mantine-color-red-light-color)",
    },
  }),
};

export const CustomSelectInput = function (props: WidgetProps) {
  const { schema, uiSchema, label, multiple, placeholder, value, onChange } =
    props;

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
      <Text size="sm" c="dimmed">
        {description}
      </Text>
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
        styles={SELECT_STYLES}
        isSearchable={true}
        isClearable={true}
      />
    </>
  );
};

import { useCallback, useEffect, useState, useMemo } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-okaidia.css";

import { Paper, Text, Button, SimpleGrid, Alert } from "@mantine/core";
import debounce from "lodash/debounce";
import validator from "@rjsf/validator-ajv8";
import { isEmpty } from "lodash";

import { SpecDefinitionJsonSchema } from "@/models/product-specs";

import { IoMdAlert } from "react-icons/io";
import { MetaJsonSchema } from "./category/details/MetaJsonSchema";
import { MetaUiSchema } from "./category/details/MetaUiSchema";

type JsonEditorProps = {
  value?: string;
  onChange?: (val: string) => void;
  minHeight?: number | string;
  label?: string;
  placeholder?: string;
  compact?: boolean;
  showFormatButton?: boolean;
  schema: SpecDefinitionJsonSchema | MetaJsonSchema | MetaUiSchema | undefined;
  maxHeight?: number | string;
  disabled?: boolean;
};

// Highlight function
const highlight = (code: string) => {
  try {
    return Prism.highlight(code, Prism.languages.json, "json");
  } catch {
    return code;
  }
};

export const JsonEditor = ({
  value = "",
  onChange,
  minHeight = 220,
  label,
  placeholder = "Paste or type JSON here...",
  compact = false,
  showFormatButton = true,
  schema,
  maxHeight,
  disabled = false,
}: JsonEditorProps) => {
  const [code, setCode] = useState<string>(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCode(value);
  }, [value]);

  // Compute line numbers
  const lineNumbers = useMemo(() => {
    const count = code.split("\n").length;
    return Array.from({ length: count }, (_, i) => i + 1).join("\n");
  }, [code]);

  const tryFormat = useCallback(
    (val: string) => {
      try {
        const parsed = JSON.parse(val);
        const pretty = JSON.stringify(parsed, null, 2);
        setCode(pretty);
        setError(null);
        onChange?.(pretty);
      } catch (e: any) {
        setError(e?.message || "Invalid JSON");
      }
    },
    [onChange]
  );

  const debouncedValidateAndNotify = useCallback(
    debounce((val: string) => {
      try {
        const parsed = JSON.parse(val);

        const { errors } = validator.validateFormData(parsed, schema as any);
        if (!isEmpty(errors)) {
          throw new Error("Invalid: " + JSON.stringify(errors, null, 2));
        }

        tryFormat(val);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Invalid JSON");
      }
    }, 600),
    [onChange, schema, tryFormat, setError]
  );

  const handleChange = useCallback(
    (val: string) => {
      setCode(val);
      debouncedValidateAndNotify(val);
    },
    [debouncedValidateAndNotify]
  );

  return (
    <div>
      {label && (
        <Text size={compact ? "sm" : "md"} mb={6}>
          {label}
        </Text>
      )}

      <Paper radius="md" p={0}>
        {error && (
          <Alert variant="light" color="red" icon={<IoMdAlert />} mb="md">
            {error}
          </Alert>
        )}

        <div
          style={{
            display: "flex",
            position: "relative",
            maxHeight: maxHeight ? maxHeight : undefined,
            overflowY: maxHeight ? "auto" : undefined,
          }}
        >
          {/* Line number gutter */}
          <pre
            style={{
              textAlign: "right",
              padding: "12px 8px",
              userSelect: "none",
              margin: 0,
              fontSize: 13,
              background: "rgba(0,0,0,0.1)",
              color: "#888",
              borderRight: "1px solid rgba(255,255,255,0.1)",
              width: "40px",
              lineHeight: "20px",
            }}
          >
            {lineNumbers}
          </pre>

          {/* JSON editor */}
          <Editor
            value={code}
            onValueChange={handleChange}
            highlight={highlight}
            padding={12}
            textareaId="mantine-json-editor"
            placeholder={placeholder}
            disabled={disabled}
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
              fontSize: 13,
              minHeight,
              outline: 0,
              border: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </Paper>

      {showFormatButton && (
        <SimpleGrid cols={1} spacing={0} mt="md">
          <Button size="xs" onClick={() => tryFormat(code)} fullWidth>
            Format
          </Button>
        </SimpleGrid>
      )}
    </div>
  );
};

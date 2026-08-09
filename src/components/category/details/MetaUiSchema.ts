// -------------------------
// Ui-specific field config
// -------------------------

export type UiFieldConfig = {
  "ui:widget"?: string;
  "ui:placeholder"?: string;
  "ui:help"?: string;
  "ui:description"?: string;
  "ui:title"?: string;
  "ui:autofocus"?: boolean;
  "ui:options"?: Record<string, any>;

  // Allow for any future custom ui:* extensions
  [extra: string]: any;
};

// -------------------------------------------
// JSON Schema describing the UI schema object
// -------------------------------------------

export type MetaUiSchema = {
  $schema?: string;
  title?: string;
  type?: "object";

  properties?: {
    "ui:order"?: {
      type: "array";
      description?: string;
      items?: { type: "string" };
      [k: string]: any;
    };
    [k: string]: any;
  };

  patternProperties?: {
    [pattern: string]: {
      type?: "object";
      additionalProperties?: boolean;
      properties?: {
        "ui:widget"?: { type: "string" };
        "ui:placeholder"?: { type: "string" };
        "ui:help"?: { type: "string" };
        "ui:description"?: { type: "string" };
        "ui:title"?: { type: "string" };
        "ui:autofocus"?: { type: "boolean" };
        "ui:options"?: {
          type: "object";
          additionalProperties?: boolean;
        };
        [k: string]: any;
      };
      [k: string]: any;
    };
  };

  additionalProperties?: boolean;

  // ---------------------------------------
  // Runtime convenience (real UI schema):
  // ---------------------------------------

  /** Ordering of UI fields */
  "ui:order"?: string[];

  /** Dynamic mapping: fieldName -> UiFieldConfig */
  [field: string]: any;
};

// ---------------------------------------
// Export the actual UI schema definition
// ---------------------------------------

export const metaUiSchema: MetaUiSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SpecDefinitionUiSchema",
  type: "object",

  properties: {
    "ui:order": {
      type: "array",
      description: "Custom ordering for fields",
      items: { type: "string" },
    },
  },

  patternProperties: {
    "^(?!ui:order$).*": {
      type: "object",
      additionalProperties: false,
      properties: {
        "ui:widget": {
          type: "string",
        },
        "ui:placeholder": {
          type: "string",
        },
        "ui:help": {
          type: "string",
        },
        "ui:description": {
          type: "string",
        },
        "ui:title": {
          type: "string",
        },
        "ui:autofocus": {
          type: "boolean",
        },
        "ui:options": {
          type: "object",
          additionalProperties: true,
        },
      },
    },
  },

  additionalProperties: false,
};

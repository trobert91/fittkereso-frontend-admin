export const metaSchema: MetaJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SpecDefinitionJsonSchema",
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["object"],
      description: "Root must be an object",
    },
    title: {
      type: "string",
    },
    properties: {
      type: "object",
      patternProperties: {
        ".*": {
          type: "object",
          required: ["type", "title", "meta"],
          properties: {
            title: {
              type: "string",
            },
            type: {
              type: "string",
              enum: ["string", "number", "boolean", "array"],
            },
            meta: {
              type: "object",
              properties: {
                unit: { type: "string" },
                order: { type: "number" },
                examples: {
                  type: "array",
                  items: { type: "string" },
                },
                useForExtraction: { type: "boolean" },
              },
              additionalProperties: false,
            },
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["string", "number", "boolean"],
                },
                enum: {
                  type: "array",
                  items: {
                    type: ["string", "number", "boolean"],
                  },
                },
              },
              required: ["type"],
              additionalProperties: true,
            },
          },
          additionalProperties: true,
          allOf: [
            {
              if: {
                properties: { type: { const: "array" } },
              },
              then: {
                required: ["items"],
              },
            },
          ],
        },
      },
      additionalProperties: false,
    },
  },
  required: ["type", "title", "properties"],
  additionalProperties: false,
};

export type MetaJsonSchema = {
  $schema: string;
  title: string;
  type: "object";
  properties: {
    type: {
      type: "string";
      enum: ["object"];
      description: string;
    };
    title: {
      type: "string";
    };
    properties: {
      type: "object";
      patternProperties: {
        [key: string]: SpecDefinition;
      };
      additionalProperties: false;
    };
  };
  required: ["type", "title", "properties"];
  additionalProperties: false;
};

/** Definition of a single property inside `properties.*` */
export type SpecDefinition = {
  type: "object";
  required: ["type", "title", "meta"];
  properties: {
    title: { type: "string" };
    type: {
      type: "string";
      enum: ["string", "number", "boolean", "array"];
    };
    meta: SpecMeta;
    items?: ArrayItemSchema;
  };
  additionalProperties: true;
  allOf: [
    {
      if: {
        properties: { type: { const: "array" } };
      };
      then: {
        required: ["items"];
      };
    }
  ];
};

/** Meta fields allowed on each spec */
export type SpecMeta = {
  type: "object";
  properties: {
    unit?: { type: "string" };
    order?: { type: "number" };
    examples?: {
      type: "array";
      items: { type: "string" };
    };
    useForExtraction?: { type: "boolean" };
  };
  additionalProperties: false;
};

/** Array items if type = "array" */
export type ArrayItemSchema = {
  type: "object";
  properties: {
    type: {
      type: "string";
      enum: ["string", "number", "boolean"];
    };
    enum?: {
      type: "array";
      items: {
        type: ["string", "number", "boolean"];
      };
    };
  };
  required: ["type"];
  additionalProperties: true;
};

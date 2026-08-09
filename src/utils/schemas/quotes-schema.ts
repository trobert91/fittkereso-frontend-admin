const SENTIMENT_VALUES = [
  "strongPositive",
  "positive",
  "neutral",
  "negative",
  "strongNegative",
  "mixed",
];

const evidenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    label: {
      type: "string",
      description: "Feature or use-case label.",
    },
    sentiment: {
      type: "string",
      enum: SENTIMENT_VALUES,
      description:
        "Sentiment applied to this evidence's label. Overrides the quote's sentiment when set; otherwise the label inherits from the quote.",
    },
    issueType: {
      type: "string",
      description:
        "Closed-list issueType label (only set on negative-sentiment feature evidence, mapped from the category's feature.issues).",
    },
  },
  required: ["label"],
};

export const quotesSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: {
        type: "string",
        description: "Stable identifier for the quote.",
      },
      text: {
        type: "string",
        minLength: 1,
        description: "The quote text content.",
      },
      sentiment: {
        type: "string",
        enum: SENTIMENT_VALUES,
        description: "The sentiment of the quote.",
      },
      speculative: {
        type: "boolean",
        description:
          "True when the whole quote is hedged, hearsay, or future-tense rather than a first-hand observation.",
      },
      quality: {
        type: "string",
        enum: ["high", "medium", "low"],
        description:
          "Buyer-utility tier — high (first-hand observation), medium (informational), low (no buyer-useful info; filtered from rating).",
      },
      features: {
        type: "array",
        items: evidenceSchema,
        description:
          "Feature-level evidence with optional per-label sentiment override and optional issueType on negative evidence.",
      },
      useCases: {
        type: "array",
        items: evidenceSchema,
        description: "Use-case-level evidence with optional per-label sentiment override.",
      },
    },
    required: ["id", "text", "sentiment"],
  },
};

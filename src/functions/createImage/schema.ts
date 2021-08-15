export default {
  type: "object",
  properties: {
    title: { type: 'string' }
  },
  required: ['title'],
  additionalProperties: false
} as const;

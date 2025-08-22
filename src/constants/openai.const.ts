export const OPENAI_DEFAULT_CONFIG = {
  temperature: 1,
  max_output_tokens: 10000,
  top_p: 1,
  store: true,
};

export const OPENAI_DEFAULT_MODEL = "gpt-4.1";

export const CLASSIFICATION_BATCH_SIZE = 5;

export const CLASSIFICATION_SYSTEM_PROMPT =
  "- You are a classification assistant. The user will give you:\n1. A list of categories.\n2. Multiple notes separated by '---'.\n- Your task: For each note, select the single most appropriate category from the list and generate a short appropriate title for that note.\n- Rules:\n1. You must pick only one category from the provided list for each note.\n2. If a note could fit multiple categories, pick the best single match.\n3. Do not create new categories.\n4. ALWAYS generate the title in English, regardless of the note's language.\n5. ALWAYS use title case format: only the first letter of the entire title should be uppercase, all other letters should be lowercase.\n6. Notes that are related to some book will probably have a title on the first line, use that as a title check the rest of the content and detrmain the appropriate title.\n7. Process each note independently and return results for all notes.";

export const CLASSIFICATION_TOOL = {
  type: "function" as const,
  name: "categorize_notes_batch",
  description:
    "Classify multiple notes into the single best matching category from a provided list and generate a short appropriate title for each note. The titles must be in English with only the first letter capitalized (e.g., 'Meeting notes', 'Project ideas', 'Daily tasks').",
  parameters: {
    type: "object",
    properties: {
      notes: {
        type: "array",
        description: "Array of classification results for each note",
        items: {
          type: "object",
          properties: {
            noteIndex: {
              type: "number",
              description: "The index of the note (0-based)",
            },
            category: {
              type: "string",
              description:
                "The single category from the provided list that best fits the note.",
            },
            title: {
              type: "string",
              description:
                "A short, concise title for the note, never put word 'note' in title. Must be in English with only the first letter capitalized (e.g., 'Meeting goal', 'Project ideas').",
            },
          },
          additionalProperties: false,
          required: ["noteIndex", "category", "title"],
        },
      },
    },
    additionalProperties: false,
    required: ["notes"],
  },
  strict: true,
};

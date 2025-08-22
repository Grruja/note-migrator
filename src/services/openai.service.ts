import OpenAI from "openai";
import {
  CLASSIFICATION_SYSTEM_PROMPT,
  CLASSIFICATION_TOOL,
  OPENAI_DEFAULT_CONFIG,
} from "../constants/openai.const";
import { ClassificationResponse, BatchClassificationResponse } from "../types";

export async function classifyNotesBatch(
  modelName: string,
  availableCategories: string[],
  notes: string[],
  apiKey: string
): Promise<ClassificationResponse[]> {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    const combinedNotes = notes.join("\n---\n");

    const response = await openai.responses.create({
      model: modelName,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: CLASSIFICATION_SYSTEM_PROMPT,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Categories: ${availableCategories.join(
                ", "
              )}\nNotes:\n${combinedNotes}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "text",
        },
      },
      reasoning: {},
      tools: [CLASSIFICATION_TOOL],
      ...OPENAI_DEFAULT_CONFIG,
    });

    const extractedData = extractDataFromResponse(response);
    if (extractedData) {
      return extractedData.notes.map((note) => ({
        category: note.category,
        title: note.title,
      }));
    }
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return notes.map(() => ({ category: "unknown", title: "Untitled" }));
  }

  return notes.map(() => ({ category: "unknown", title: "Untitled" }));
}

function extractDataFromResponse(
  openaiResponse: any
): BatchClassificationResponse | null {
  const firstOutput = openaiResponse.output?.[0];

  if (
    !firstOutput ||
    firstOutput.type !== "function_call" ||
    !("arguments" in firstOutput) ||
    !firstOutput.arguments
  ) {
    return null;
  }

  try {
    const parsedArguments = JSON.parse(firstOutput.arguments);

    if (
      parsedArguments.notes &&
      Array.isArray(parsedArguments.notes) &&
      parsedArguments.notes.length > 0
    ) {
      return {
        notes: parsedArguments.notes.map((note: any) => ({
          noteIndex: note.noteIndex || 0,
          category: note.category || "unknown",
          title: note.title || "Untitled",
        })),
      };
    }
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    return null;
  }

  return null;
}

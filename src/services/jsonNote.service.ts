import fs from "fs-extra";
import path from "path";
import vm from "vm";
import { ExtractedNote } from "../types";
import { collapseWhitespace } from "../helpers/text.helper";

const DATA_PATHS = ["data", "default.data", "root"];
const MAX_CONTENT_LENGTH = 250; // Approximately two sentences

export async function extractFromJsonFile(
  absoluteFilePath: string
): Promise<ExtractedNote> {
  try {
    const directoryPath = path.dirname(absoluteFilePath);
    const jsonFilePath = path.join(directoryPath, "json.js");

    const fileExists = await fs.pathExists(jsonFilePath);
    if (!fileExists) {
      throw new Error(
        `Failed to extract data from json.js for ${absoluteFilePath}`
      );
    }

    const jsonSource = await fs.readFile(jsonFilePath, "utf8");
    const context: any = {};
    vm.createContext(context);
    vm.runInContext(jsonSource, context, {
      timeout: 50,
      filename: "json.js",
    });

    const data = extractDataFromContext(context);
    if (!data?.content) {
      throw new Error(
        `Failed to extract data from json.js for ${absoluteFilePath}`
      );
    }

    const extractedContent = extractContentFromData(data.content);
    if (!extractedContent) {
      throw new Error(
        `Failed to extract data from json.js for ${absoluteFilePath}`
      );
    }

    return {
      title: extractedContent.title ?? "Untitled",
      plainText: truncateContent(extractedContent.plainText ?? ""),
      markdownContent: truncateContent(extractedContent.markdown ?? ""),
    };
  } catch (error) {
    throw new Error(
      `Failed to extract data from json.js for ${absoluteFilePath}: ${error}`
    );
  }
}

function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) return content;

  const truncated = content.substring(0, MAX_CONTENT_LENGTH);
  const lastSpaceIndex = truncated.lastIndexOf(" ");

  // If we can find a space in the last 20% of the truncated content, break there
  if (lastSpaceIndex > MAX_CONTENT_LENGTH * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + "...";
  }

  return truncated + "...";
}

function extractDataFromContext(context: any): any {
  for (const dataPath of DATA_PATHS) {
    if (dataPath === "root") return context;
    if (dataPath === "default.data") return context.default?.data;
    if (context[dataPath]) return context[dataPath];
  }
  return null;
}

function extractContentFromData(
  content: any
): { title?: string; plainText?: string; markdown?: string } | null {
  const extractedContent: {
    title?: string;
    plainText?: string;
    markdown?: string;
  } = {};

  if (typeof content.title === "string" && content.title.trim()) {
    extractedContent.title = content.title.trim();
  }

  const contentString =
    typeof content.content === "string" ? content.content : undefined;

  if (contentString?.trim()) {
    const parsedContent = parseSerializedContent(contentString);
    if (parsedContent.plainText) {
      extractedContent.plainText = parsedContent.plainText;
    }
    if (parsedContent.markdown) {
      extractedContent.markdown = parsedContent.markdown;
    }
  }

  return extractedContent.title ||
    extractedContent.plainText ||
    extractedContent.markdown
    ? extractedContent
    : null;
}

function parseSerializedContent(contentString: string): {
  plainText: string;
  markdown: string;
} {
  const contentPieces = contentString.split("<>><><<<");
  const textLines: string[] = [];
  const markdownParts: string[] = [];
  let isInList = false;

  function openList(): void {
    if (!isInList) {
      markdownParts.push("");
      isInList = true;
    }
  }

  function closeList(): void {
    if (isInList) {
      markdownParts.push("");
      isInList = false;
    }
  }

  for (const rawPiece of contentPieces) {
    if (!rawPiece) continue;

    const [contentType, ...remainingParts] = rawPiece.split("|");
    const contentValue = remainingParts.join("|");

    if (contentType === "Text" && contentValue) {
      closeList();
      textLines.push(contentValue);
      markdownParts.push(`${contentValue}\n\n`);
    } else if (contentType === "Bullet" && contentValue) {
      const bulletResult = processBulletContent(contentValue);
      openList();
      textLines.push(bulletResult.plainText);
      markdownParts.push(bulletResult.markdown);
    } else if (contentType === "Attachment" && contentValue) {
      const attachmentResult = processAttachmentContent(contentValue);
      closeList();
      textLines.push(attachmentResult.plainText);
      markdownParts.push(attachmentResult.markdown);
    }
  }

  closeList();

  const plainText = collapseWhitespace(textLines.join("\n"));
  const markdown = markdownParts.join("").trim();

  return { plainText, markdown };
}

function processBulletContent(contentValue: string): {
  plainText: string;
  markdown: string;
} {
  const finishedFlag = contentValue.substring(0, 1);
  const bulletText = contentValue.substring(1);
  const isChecked = parseInt(finishedFlag, 10) ? "1" : "0";
  const marker = isChecked === "1" ? "[x] " : "[ ] ";

  return {
    plainText: `- ${marker}${bulletText}`,
    markdown: `- ${marker}${bulletText}\n`,
  };
}

function processAttachmentContent(contentValue: string): {
  plainText: string;
  markdown: string;
} {
  const pathParts = contentValue.split("/");
  const fileName = pathParts[pathParts.length - 1] || contentValue;
  const attachmentHref = `attachment/${fileName}`;

  return {
    plainText: `[attachment] ${fileName}`,
    markdown: `[${fileName}](${attachmentHref})\n\n`,
  };
}

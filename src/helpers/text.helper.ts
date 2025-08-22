import { Category } from "../types";

export function collapseWhitespace(inputText: string): string {
  const normalizedText = inputText.replace(/\r\n?/g, "\n");

  const linesWithoutTrailingSpaces = normalizedText
    .split("\n")
    .map((line) => line.replace(/[\t\x0B\f\r ]+/g, " ").trimEnd())
    .join("\n");

  const textWithLimitedNewlines = linesWithoutTrailingSpaces.replace(
    /\n{3,}/g,
    "\n\n"
  );

  return textWithLimitedNewlines.trim();
}

export function firstNonEmptyLine(inputText: string): string | undefined {
  const textLines = inputText.split(/\r?\n/).map((line) => line.trim());
  return textLines.find((line) => line.length > 0);
}

export function toSlug(inputText: string): string {
  const trimmedLowercaseText = inputText.trim().toLowerCase();

  const normalizedText = trimmedLowercaseText.normalize("NFKD");
  const textWithoutDiacritics = normalizedText.replace(/[\u0300-\u036f]/g, "");
  const textWithDashes = textWithoutDiacritics.replace(/[^a-z0-9]+/g, "-");
  const textWithoutLeadingTrailingDashes = textWithDashes.replace(
    /^-+|-+$/g,
    ""
  );
  const truncatedText = textWithoutLeadingTrailingDashes.slice(0, 80);

  return truncatedText.length > 0 ? truncatedText : "untitled";
}

export function safePathComponent(componentName: string): string {
  const textWithoutDirectoryTraversal = componentName.replace(/[\\/]+/g, "-");
  const textWithoutIllegalCharacters = textWithoutDirectoryTraversal.replace(
    /[\0<>:"|?*]/g,
    "-"
  );
  const trimmedText = textWithoutIllegalCharacters.trim();

  return trimmedText.length > 0 ? trimmedText : "unknown";
}

export function parseCommaSeparatedCategories(
  categoryString: string
): Category[] {
  return categoryString
    .split(",")
    .map((category) => category.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

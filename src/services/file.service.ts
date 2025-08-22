import fg from "fast-glob";
import path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import { NoteJob } from "../types";
import { safePathComponent } from "../helpers/text.helper";

export async function discoverNoteDirectories(
  inputDirectory: string
): Promise<NoteJob[]> {
  const directoryEntries = await fg("*/", {
    cwd: inputDirectory,
    onlyDirectories: true,
    dot: false,
    ignore: [
      "**/attachment/**",
      "**/attachments/**",
      "**/files/**",
      "**/images/**",
    ],
  });

  const noteJobs: NoteJob[] = [];

  for (const directoryPath of directoryEntries) {
    const hasRequiredFiles = await checkRequiredFiles(
      inputDirectory,
      directoryPath
    );
    if (!hasRequiredFiles) {
      if (!isNonNoteDirectory(directoryPath)) {
        console.error(
          `Warning: directory missing required files, skipping: ${directoryPath}`
        );
      }
      continue;
    }

    const jsonFilePath = path.join(directoryPath, "json.js");
    const absoluteJsonPath = path.resolve(inputDirectory, jsonFilePath);
    const folderName = path.basename(directoryPath);
    const jobId = generateStableHash(directoryPath);

    const fileStats = await fs.stat(absoluteJsonPath);

    if (!fileStats?.isFile()) {
      console.error(`Warning: JSON file not found, skipping: ${jsonFilePath}`);
      continue;
    }

    noteJobs.push({
      id: jobId,
      sourcePath: absoluteJsonPath,
      relativePath: jsonFilePath,
      folderName,
    });
  }

  return noteJobs;
}

async function checkRequiredFiles(
  inputDirectory: string,
  directoryPath: string
): Promise<boolean> {
  for (const requiredFile of ["notePad.html", "json.js"]) {
    const filePath = path.join(directoryPath, requiredFile);
    const absolutePath = path.resolve(inputDirectory, filePath);
    const exists = await fs.pathExists(absolutePath);
    if (!exists) return false;
  }
  return true;
}

function generateStableHash(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 16);
}

function isNonNoteDirectory(directoryPath: string): boolean {
  const lowerPath = directoryPath.toLowerCase();
  return (
    lowerPath.includes("attachment") ||
    lowerPath.includes("attachments") ||
    lowerPath.includes("files") ||
    lowerPath.includes("images") ||
    lowerPath.includes("media") ||
    lowerPath.includes("temp") ||
    lowerPath.includes("cache")
  );
}

export async function writeNoteToFile(
  config: any,
  markdownContent: string,
  category: string,
  aiGeneratedTitle: string
): Promise<string | undefined> {
  if (config.dryRun) {
    return undefined;
  }

  const categoryDirectory = path.join(
    config.outputDir,
    safePathComponent(category)
  );
  await fs.ensureDir(categoryDirectory);

  const filenameBase = aiGeneratedTitle;
  const outputPath = await generateUniqueFilePath(
    categoryDirectory,
    filenameBase
  );

  await fs.writeFile(outputPath, `${markdownContent}\n`, "utf8");
  return outputPath;
}

async function generateUniqueFilePath(
  directory: string,
  baseFilename: string
): Promise<string> {
  let filePath = path.join(directory, `${baseFilename}.md`);
  let counter = 1;

  while (await fs.pathExists(filePath)) {
    filePath = path.join(directory, `${baseFilename}-${counter}.md`);
    counter++;
  }

  return filePath;
}

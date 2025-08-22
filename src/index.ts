import dotenv from "dotenv";
dotenv.config();

import { resolveConfigFromCLI } from "./services/cli.service";
import {
  discoverNoteDirectories,
  writeNoteToFile,
} from "./services/file.service";
import { extractFromJsonFile } from "./services/jsonNote.service";
import cliProgress from "cli-progress";
import { classifyNotesBatch } from "./services/openai.service";
import { CLASSIFICATION_BATCH_SIZE } from "./constants/openai.const";
import { Category, ProcessingResult } from "./types";
import {
  displaySummary,
  displayProcessingStart,
  displayError,
} from "./helpers/cliDisplay.helper";

async function main() {
  try {
    const config = await resolveConfigFromCLI(process.argv);
    const noteJobs = await discoverNoteDirectories(config.inputDir);

    if (noteJobs.length === 0) {
      displayError("No note directories found.");
      process.exit(1);
    }

    displayProcessingStart(noteJobs.length);
    const progressBar = setupProgressBar(noteJobs.length);
    const processingResults: ProcessingResult[] = [];
    const batches = splitArrayIntoChunks(noteJobs, CLASSIFICATION_BATCH_SIZE);

    for (const batch of batches) {
      try {
        const batchResults = await processBatch(batch, config, progressBar);
        processingResults.push(...batchResults);
      } catch (error: any) {
        const errorResults = handleBatchError(batch, error, progressBar);
        processingResults.push(...errorResults);
      }
    }

    progressBar.stop();
    displaySummary(config, noteJobs.length, processingResults);
  } catch (error: any) {
    displayError(`Unexpected error: ${error.message || error}`);
    process.exit(1);
  }
}

function setupProgressBar(totalNotes: number) {
  const progressBar = new cliProgress.SingleBar(
    { clearOnComplete: true },
    cliProgress.Presets.shades_classic
  );
  progressBar.start(totalNotes, 0);
  return progressBar;
}

async function processBatch(
  batch: any[],
  config: any,
  progressBar: any
): Promise<ProcessingResult[]> {
  const batchNotes = await extractBatchNotes(batch);
  const validBatchNotes = batchNotes.filter((note) => !note.error);
  const failedNotes = batchNotes.filter((note) => note.error);

  const results: ProcessingResult[] = [];

  failedNotes.forEach((note) => {
    results.push({
      jobId: note.job.id,
      title: note.job.sourcePath,
      category: "ERROR",
      score: 0,
      error: note.error,
    });
    progressBar.increment();
  });

  if (validBatchNotes.length > 0) {
    const classificationResults = await classifyAndProcessNotes(
      validBatchNotes,
      config,
      progressBar
    );
    results.push(...classificationResults);
  }

  return results;
}

async function extractBatchNotes(batch: any[]): Promise<any[]> {
  return Promise.all(
    batch.map(async (job) => {
      try {
        const extractedNote = await extractFromJsonFile(job.sourcePath);
        return {
          job,
          extractedNote,
          markdownContent:
            extractedNote.markdownContent || extractedNote.plainText,
        };
      } catch (error: any) {
        return {
          job,
          extractedNote: null,
          markdownContent: "",
          error: String(error?.message || error),
        };
      }
    })
  );
}

async function classifyAndProcessNotes(
  validNotes: any[],
  config: any,
  progressBar: any
): Promise<ProcessingResult[]> {
  const noteContents = validNotes.map((note) => note.markdownContent);
  const classificationResults = await classifyNotesBatch(
    config.openaiModel,
    config.categories.map((category: Category) => category.name),
    noteContents,
    config.openaiApiKey
  );

  const results: ProcessingResult[] = [];

  for (let i = 0; i < validNotes.length; i++) {
    const note = validNotes[i];
    const classificationResult = classificationResults[i];

    if (!note || !classificationResult) continue;

    try {
      const outputPath = await writeNoteToFile(
        config,
        note.markdownContent,
        classificationResult.category,
        classificationResult.title
      );

      results.push({
        jobId: note.job.id,
        title: classificationResult.title,
        category: classificationResult.category,
        score: 1,
        outPath: outputPath,
      });
    } catch (error: any) {
      results.push({
        jobId: note.job.id,
        title: note.job.sourcePath,
        category: "ERROR",
        score: 0,
        error: String(error?.message || error),
      });
    } finally {
      progressBar.increment();
    }
  }

  return results;
}

function handleBatchError(
  batch: any[],
  error: any,
  progressBar: any
): ProcessingResult[] {
  const results: ProcessingResult[] = [];

  batch.forEach((job) => {
    results.push({
      jobId: job.id,
      title: job.sourcePath,
      category: "ERROR",
      score: 0,
      error: String(error?.message || error),
    });
    progressBar.increment();
  });

  return results;
}

function splitArrayIntoChunks<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

main().catch(() => {
  process.exit(1);
});

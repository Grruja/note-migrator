export type Category = {
  name: string;
  description?: string | undefined;
};

export type Config = {
  inputDir: string;
  outputDir: string;
  categories: Category[];
  openaiModel: string;
  openaiApiKey: string;
  dryRun: boolean;
};

export type NoteJob = {
  id: string;
  sourcePath: string;
  relativePath: string;
  folderName: string;
};

export type ExtractedNote = {
  title: string;
  plainText: string;
  markdownContent: string;
};

export interface ProcessingResult {
  jobId: string;
  title: string;
  category: string;
  score: number;
  outPath?: string | undefined;
  error?: string | undefined;
}

export interface SummaryStats {
  config: {
    categories: string[];
    inputDir: string;
    outputDir: string;
  };
  processed: number;
  ok: number;
  failed: number;
}

export interface ClassificationResponse {
  category: string;
  title: string;
}

export interface BatchClassificationResponse {
  notes: Array<{
    noteIndex: number;
    category: string;
    title: string;
  }>;
}

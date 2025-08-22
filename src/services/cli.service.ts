import { Command } from "commander";
import prompts from "prompts";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import chalk from "chalk";
import { Category, Config } from "../types";
import { parseCommaSeparatedCategories } from "../helpers/text.helper";
import { OPENAI_DEFAULT_MODEL } from "../constants/openai.const";
import {
  displayWelcome,
  displayConfig,
  displayError,
  displayInfo,
  displaySuccess,
  displayWarning,
} from "../helpers/cliDisplay.helper";

const MINIMUM_CATEGORIES_REQUIRED = 2;

async function promptForInputDirectory(): Promise<string> {
  const response = await prompts({
    type: "text",
    name: "directory",
    message: "📁 Where are your notes located?",
    initial: "./old-notes",
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Please enter a directory path";
      }
      return true;
    },
  });
  return path.resolve(response.directory);
}

async function promptForCategories(): Promise<Category[]> {
  const response = await prompts({
    type: "text",
    name: "categories",
    message: "🏷️  What categories should I use to organize your notes?",
    initial: "Work,Personal,Ideas,Books,Workout,Nutrition",
    hint: "Separate with commas (e.g., Work, Personal, Ideas)",
    validate: (value) => {
      const categoryCount =
        value?.split(",").filter((category: string) => category.trim())
          .length ?? 0;
      if (categoryCount < MINIMUM_CATEGORIES_REQUIRED) {
        return `Please enter at least ${MINIMUM_CATEGORIES_REQUIRED} categories`;
      }
      return true;
    },
  });
  return parseCommaSeparatedCategories(response.categories);
}

async function promptForOutputDirectory(): Promise<string> {
  const response = await prompts({
    type: "text",
    name: "directory",
    message: "📤 Where should I save the converted notes?",
    initial: "./output",
    validate: async (value) => {
      if (!value || value.trim().length === 0) {
        return "Please enter an output directory";
      }

      const resolvedPath = path.resolve(value);

      // Check if directory exists and is not empty
      if (fs.existsSync(resolvedPath)) {
        try {
          const files = fs.readdirSync(resolvedPath);
          if (files.length > 0) {
            return "Directory is not empty. Please choose an empty directory or clear it first.";
          }
        } catch (error) {
          return "Cannot read directory contents. Please check permissions.";
        }
      }

      return true;
    },
  });
  return path.resolve(response.directory);
}

async function promptForOpenAIModel(): Promise<string> {
  const response = await prompts({
    type: "select",
    name: "model",
    message: "🤖 Which AI model should I use for classification?",
    choices: [
      { title: "GPT-4 (Most Accurate)", value: "gpt-4" },
      { title: "GPT-3.5 Turbo (Faster & Cheaper)", value: "gpt-3.5-turbo" },
      { title: "Custom Model", value: "custom" },
    ],
    initial: 0,
  });

  if (response.model === "custom") {
    const customResponse = await prompts({
      type: "text",
      name: "customModel",
      message: "Enter custom model name:",
      initial: OPENAI_DEFAULT_MODEL,
      validate: (value) =>
        value && value.trim().length > 0 ? true : "Please enter a model name",
    });
    return customResponse.customModel;
  }

  return response.model;
}

async function promptForDryRun(): Promise<boolean> {
  const response = await prompts({
    type: "confirm",
    name: "dryRun",
    message:
      "🧪 Would you like to do a dry run first? (No files will be created)",
    initial: false,
  });
  return response.dryRun;
}

async function promptForOpenAIAPIKey(): Promise<string> {
  const response = await prompts({
    type: "password",
    name: "apiKey",
    message: "🔑 Enter your OpenAI API key:",
    hint: `Get your API key from: ${chalk.blue.underline(
      "https://platform.openai.com/settings/organization/api-keys"
    )}`,
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Please enter your OpenAI API key";
      }
      if (!value.startsWith("sk-")) {
        return "API key should start with 'sk-'";
      }
      return true;
    },
  });
  return response.apiKey;
}

async function saveAPIKeyToEnv(apiKey: string): Promise<void> {
  const envPath = path.join(process.cwd(), ".env");
  const envContent = `OPENAI_API_KEY=${apiKey}\n`;

  try {
    if (fs.existsSync(envPath)) {
      // Read existing .env file
      const existingContent = fs.readFileSync(envPath, "utf8");

      // Check if OPENAI_API_KEY already exists
      if (existingContent.includes("OPENAI_API_KEY=")) {
        // Replace existing key
        const updatedContent = existingContent.replace(
          /OPENAI_API_KEY=.*/g,
          `OPENAI_API_KEY=${apiKey}`
        );
        fs.writeFileSync(envPath, updatedContent);
      } else {
        // Append new key
        fs.appendFileSync(envPath, envContent);
      }
    } else {
      // Create new .env file
      fs.writeFileSync(envPath, envContent);
    }

    displaySuccess("API key saved to .env file");
  } catch (error) {
    displayWarning(
      "Could not save API key to .env file. Please save it manually."
    );
    console.log(
      chalk.gray(`Add this line to your .env file: OPENAI_API_KEY=${apiKey}`)
    );
  }
}

async function getOrPromptForAPIKey(): Promise<string> {
  // Load environment variables
  dotenv.config();

  let apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    displayInfo("No OpenAI API key found in environment variables.");
    displayInfo("You'll need to provide your OpenAI API key to continue.");
    console.log(
      chalk.gray(
        `Get your API key from: ${chalk.blue.underline(
          "https://platform.openai.com/settings/organization/api-keys"
        )}`
      )
    );

    apiKey = await promptForOpenAIAPIKey();
    await saveAPIKeyToEnv(apiKey);
  }

  return apiKey;
}

export async function resolveConfigFromCLI(
  commandLineArguments: string[]
): Promise<Config> {
  // Show welcome message
  displayWelcome();

  const program = new Command();
  program
    .name("note-migrator")
    .description("AI-powered note classification and migration tool")
    .version("1.0.0")
    .option("-i, --input <dir>", "root directory containing note folders")
    .option("-o, --output <dir>", "destination root", "./output")
    .option("-c, --categories <list>", "comma-separated list of categories")
    .option(
      "-m, --model <name>",
      "OpenAI model for classification",
      OPENAI_DEFAULT_MODEL
    )
    .option(
      "-k, --api-key <key>",
      "OpenAI API key (will prompt if not provided)"
    )
    .option("-d, --dry-run", "simulate without writing files", false)
    .option("--interactive", "use interactive prompts for all options", false);

  program.parse(commandLineArguments);
  const options = program.opts();

  // Check if user wants interactive mode or if no options provided
  const useInteractive =
    options.interactive || (!options.input && !options.categories);

  let inputDirectory = "";
  let outputDirectory = "";
  let openaiModel = "";
  let openaiApiKey = "";
  let dryRun = false;
  let categories: Category[] = [];

  if (useInteractive) {
    displayInfo(
      "Let's set up your note migration! I'll ask you a few questions...\n"
    );

    inputDirectory = await promptForInputDirectory();
    outputDirectory = await promptForOutputDirectory();
    openaiModel = await promptForOpenAIModel();

    if (options.apiKey) {
      openaiApiKey = String(options.apiKey);
    } else {
      openaiApiKey = await getOrPromptForAPIKey();
    }

    dryRun = await promptForDryRun();
    categories = await promptForCategories();
  } else {
    // Use command line options
    inputDirectory = options.input ? path.resolve(String(options.input)) : "";
    outputDirectory = path.resolve(String(options.output ?? "./output"));
    openaiModel = String(options.model ?? OPENAI_DEFAULT_MODEL);

    if (options.apiKey) {
      openaiApiKey = String(options.apiKey);
    } else {
      openaiApiKey = await getOrPromptForAPIKey();
    }

    dryRun = Boolean(options.dryRun);

    if (!inputDirectory) {
      displayError(
        "Input directory is required. Use --input <dir> or --interactive"
      );
      process.exit(1);
    }

    if (options.categories) {
      categories = parseCommaSeparatedCategories(options.categories);
    } else {
      displayError(
        "Categories are required. Use --categories <list> or --interactive"
      );
      process.exit(1);
    }
  }

  // Validate categories
  if (categories.length < MINIMUM_CATEGORIES_REQUIRED) {
    displayError(
      `At least ${MINIMUM_CATEGORIES_REQUIRED} categories are required`
    );
    process.exit(1);
  }

  const config: Config = {
    inputDir: inputDirectory,
    outputDir: outputDirectory,
    categories,
    openaiModel,
    openaiApiKey,
    dryRun,
  };

  // Show configuration summary
  displayConfig(config);

  if (dryRun) {
    displayWarning("🧪 DRY RUN MODE: No files will be created");
  }

  return config;
}

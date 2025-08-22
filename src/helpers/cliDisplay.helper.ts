import { Category, ProcessingResult, SummaryStats } from "../types";
import chalk from "chalk";
import boxen from "boxen";

export function displayWelcome(): void {
  const welcomeMessage = boxen(
    chalk.blue.bold("📝 Note Migrator") +
      "\n" +
      chalk.gray("AI-powered note classification and migration tool"),
    {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "blue",
    }
  );
  console.log(welcomeMessage);
}

export function displayConfig(config: any): void {
  const configBox = boxen(
    chalk.cyan.bold("⚙️  Configuration") +
      "\n\n" +
      chalk.white("📁 Input Directory: ") +
      chalk.yellow(config.inputDir) +
      "\n" +
      chalk.white("📤 Output Directory: ") +
      chalk.yellow(config.outputDir) +
      "\n" +
      chalk.white("🤖 AI Model: ") +
      chalk.yellow(config.openaiModel) +
      "\n" +
      chalk.white("🔑 OpenAI API Key: ") +
      chalk.green(config.openaiApiKey ? "Configured" : "Not configured") +
      "\n" +
      chalk.white("🏷️  Categories: ") +
      chalk.green(config.categories.map((c: Category) => c.name).join(", ")) +
      "\n" +
      chalk.white("🧪 Dry Run: ") +
      chalk.yellow(config.dryRun ? "Yes" : "No"),
    {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "cyan",
    }
  );
  console.log(configBox);
}

export function displayProcessingStart(totalNotes: number): void {
  console.log(
    chalk.blue.bold(`\n🚀 Starting migration of ${totalNotes} notes...\n`)
  );
}

export function displaySummary(
  config: any,
  totalProcessed: number,
  results: ProcessingResult[]
): void {
  const successfulResults = results.filter((result) => !result.error);
  const failedResults = results.filter((result) => result.error);
  const successRate =
    totalProcessed > 0
      ? ((successfulResults.length / totalProcessed) * 100).toFixed(1)
      : "0";

  console.log("\n" + "=".repeat(60));

  const summaryBox = boxen(
    chalk.green.bold("✅ Migration Complete!") +
      "\n\n" +
      chalk.white("📊 Summary:") +
      "\n" +
      chalk.white("   • Total Processed: ") +
      chalk.blue(totalProcessed) +
      "\n" +
      chalk.white("   • Successful: ") +
      chalk.green(successfulResults.length) +
      "\n" +
      chalk.white("   • Failed: ") +
      chalk.red(failedResults.length) +
      "\n" +
      chalk.white("   • Success Rate: ") +
      chalk.cyan(`${successRate}%`) +
      "\n\n" +
      chalk.white("📁 Output Location: ") +
      chalk.yellow(config.outputDir),
    {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor:
        successRate === "100"
          ? "green"
          : failedResults.length > 0
          ? "yellow"
          : "green",
    }
  );

  console.log(summaryBox);

  if (failedResults.length > 0) {
    console.log(chalk.yellow.bold("\n⚠️  Failed Notes:"));
    failedResults.slice(0, 5).forEach((result, index) => {
      console.log(chalk.red(`   ${index + 1}. ${result.title}`));
      if (result.error) {
        console.log(chalk.gray(`      Error: ${result.error}`));
      }
    });

    if (failedResults.length > 5) {
      console.log(chalk.gray(`   ... and ${failedResults.length - 5} more`));
    }
  }

  if (successfulResults.length > 0) {
    console.log(chalk.green.bold("\n🎯 Sample Successful Migrations:"));
    successfulResults.slice(0, 3).forEach((result, index) => {
      console.log(chalk.green(`   ${index + 1}. ${result.title}`));
      console.log(chalk.gray(`      Category: ${result.category}`));
    });

    if (successfulResults.length > 3) {
      console.log(
        chalk.gray(`   ... and ${successfulResults.length - 3} more`)
      );
    }
  }

  console.log("\n" + "=".repeat(60));
}

export function displayError(message: string): void {
  const errorBox = boxen(
    chalk.red.bold("💥 Error") + "\n\n" + chalk.white(message),
    {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    }
  );
  console.error(errorBox);
}

export function displayInfo(message: string): void {
  console.log(chalk.blue("ℹ️  " + message));
}

export function displaySuccess(message: string): void {
  console.log(chalk.green("✅ " + message));
}

export function displayWarning(message: string): void {
  console.log(chalk.yellow("⚠️  " + message));
}

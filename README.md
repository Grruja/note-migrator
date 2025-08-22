# 📝 Note Migrator

> **AI-powered note classification and migration tool with a CLI interface**

Transform your scattered notes into organized, categorized Markdown files using OpenAI's AI classification. Perfect for migrating notes from various sources into a structured knowledge base.

## ✨ Features

- 🤖 **AI-Powered Classification** - Automatically categorizes notes using OpenAI
- 🎨 **CLI Interface** - Interactive prompts with colors and visual feedback
- 🏷️ **Flexible Categories** - Define your own category system
- 📊 **Progress Tracking** - Real-time progress bars and detailed summaries
- 🧪 **Dry Run Mode** - Test without making changes
- 🚀 **Batch Processing** - Efficient processing of multiple notes

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd note-migrator

# 2. Install dependencies
npm install

# 3. Run the tool
npm run note-migrator
```

**🎁 Bonus:** The project comes with example notes in the `old-notes/` directory, so you can test the tool immediately after cloning!

The tool will guide you through:

1. 📁 **Input Directory** - Where your notes are located
2. 📤 **Output Directory** - Where to save converted notes
3. 🤖 **AI Model** - Choose between GPT-4 (accurate) or GPT-3.5 (fast)
4. 🔑 **OpenAI API key** - Provide your OpenAI API key
5. 🏷️ **Categories** - Define your note categories
6. 🧪 **Dry Run** - Test the process first

## 📋 CLI Options

| Option                | Short | Description                                  | Default    |
| --------------------- | ----- | -------------------------------------------- | ---------- |
| `--input <dir>`       | `-i`  | Root directory containing note folders       | _Required_ |
| `--output <dir>`      | `-o`  | Destination root directory                   | `./output` |
| `--categories <list>` | `-c`  | Comma-separated list of categories           | _Required_ |
| `--model <name>`      | `-m`  | OpenAI model for classification              | `gpt-4`    |
| `--api-key <key>`     | `-k`  | OpenAI API key (will prompt if not provided) | _Prompted_ |
| `--dry-run`           | `-d`  | Simulate without writing files               | `false`    |
| `--interactive`       |       | Use interactive prompts for all options      | `false`    |

## 📝 Note Format Support

The tool currently supports notes stored in directories containing:

- `json.js` - Note content in JSON format
- `notePad.html` - Note metadata (optional)

## 🎯 Example Workflow

1. **Organize your notes** in separate directories
2. **Run the migrator** with interactive prompts
3. **Review the configuration** before processing
4. **Watch the progress** as notes are classified
5. **Get a summary** of the migration results

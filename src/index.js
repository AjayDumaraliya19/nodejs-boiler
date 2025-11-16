#!/usr/bin/env node

import { fileURLToPath } from "url";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import ora from "ora";

/* --------------------- Fix for __dirname in ES module --------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------- CONSTANTS ------------------------------- */
const TEMPLATE_DIR = path.join(__dirname, "templates");
const DEFAULT_PROJECT_NAME = "nodejs_boiler-app";

/* ------------------ HELPER Function To cop Template Files ----------------- */
async function copyTemplateFiles(source, destination, data = {}) {
  try {
    // Create destination directory if it doesn't exist
    await fs.ensureDir(destination);

    // Copy files from template directory
    const files = await fs.readdir(source);

    for (const file of files) {
      // Skip node_modules and .git directories
      if (["node_modules", ".git", ".DS_Store"].includes(file)) continue;

      const srcPath = path.join(source, file);
      const destPath = path.join(destination, file);

      // If it's a directory, copy its contents
      const stat = await fs.stat(srcPath);

      if (stat.isDirectory()) {
        await fs.ensureDir(destPath);
        await copyTemplateFiles(srcPath, destPath, data);
      } else {
        // Process file content if it's package.json
        if (file === "package.json" && (await fs.pathExists(destPath))) {
          // Merge package.json files if they exist
          const srcPkg = JSON.parse(await fs.readFile(srcPath, "utf-8"));
          const destPkg = JSON.parse(await fs.readFile(destPath, "utf-8"));

          // Merge dependancies
          const mergedPkg = {
            ...destPkg,
            ...srcPkg,
            scripts: { ...destPkg.scripts, ...srcPkg.scripts },
            dependencies: { ...destPkg.dependencies, ...srcPkg.dependencies },
            devDependencies: {
              ...destPkg.devDependencies,
              ...srcPkg.devDependencies,
            },
          };

          // await fs.writeFile(destPath, JSON.stringify(mergedPkg, null, 2), "utf-8");
          await fs.writeJson(destPath, mergedPkg, { spaces: 2 });
        } else {
          // For other files, just copy them
          await fs.copyFile(srcPath, destPath);

          // If it's .env.example, rename it to .env
          if (
            file === ".env.example" &&
            !(await fs.pathExists(path.join(destination, ".env")))
          ) {
            await fs.rename(destPath, path.join(destination, ".env"));
          }
        }
      }

      // Set execute permission for shell scripts
      if (file.endsWith(".sh") || !path.extname(file)) {
        await fs.chmod(destPath, 0o755);
      }
    }

    return true;
  } catch (error) {
    console.error(chalk.red("Error coppying template files:"), error?.message);
    return false;
  }
}

/* ----------------------------- MAIN funcation ----------------------------- */
async function main() {
  try {
    console.log(
      chalk.blueBright.bold(
        "\n🚀 Welcome to NodeJS-Boilr project Generator!\n",
      ),
    );

    let projectName = DEFAULT_PROJECT_NAME;
    let targetDir = process.cwd();

    // Folder Selection
    const { folderChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "folderChoice",
        message: "Select a folder:",
        choices: [
          { name: "New directory", value: "new" },
          { name: "Current directory", value: "current" },
        ],
        default: "new",
      },
    ]);

    if (folderChoice === "new") {
      const { dirName } = await inquirer.prompt([
        {
          type: "input",
          name: "dirName",
          message: "Project folder Name:",
          default: DEFAULT_PROJECT_NAME,
          validate: (input) =>
            !!input.trim() || "Project name cannot be empty!",
        },
      ]);

      projectName = dirName.trim();
      targetDir = path.join(process.cwd(), projectName);

      if (await fs.pathExists(targetDir)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: "confirm",
            name: "overwrite",
            message: `Directory "${projectName}" already exists. Overwrite?`,
            default: false,
          },
        ]);
        if (!overwrite) {
          console.log(chalk.yellow("\n⚠️ Operation cancelled."));
          process.exit(1);
        }

        console.log(
          chalk.yellow(`\n🧹 Removing existing directory: ${targetDir}`),
        );
        await fs.remove(targetDir);
      }

      await fs.ensureDir(targetDir);
    }

    // Project type
    const { projectType } = await inquirer.prompt([
      {
        type: "list",
        name: "projectType",
        message: "Select a database:",
        choices: [
          { name: "mongodb", value: "mongodb" },
          { name: "postgresql", value: "sql" },
        ],
        default: "mongodb",
      },
    ]);

    // Determine Template Directory based on Project Type
    const templateDir = path.join(TEMPLATE_DIR, projectType);
    const spinner = ora("Generating project...").start();
    const success = await copyTemplateFiles(templateDir, targetDir, {
      projectName,
      projectType,
    });
    if (!success) {
      spinner.fail("Failed to copy template files.");
      process.exit(1);
    }

    // Update package.json based on projec type
    const packageJsonPath = path.join(targetDir, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);

      // Ensure scripts and dependencies exists
      pkg.scripts = pkg.scripts || {};
      pkg.dependencies = pkg.dependencies || {};
      pkg.devDependencies = pkg.devDependencies || {};

      // Common Scripts
      pkg.scripts.start = "node src/index.js";
      pkg.scripts.dev = "nodemon src/index.js";

      // Add ESLint + Jest
      Object.assign(pkg.devDependencies, { nodemon: "^3.1.10" });

      await fs.writeJson(packageJsonPath, pkg, { spaces: 2 });
    }

    // Show success message
    spinner.succeed("✅ Project generated successfully!");

    // Display post-installation instructions
    displayPostInstallInstructions(targetDir, projectType, projectName);

    console.log(chalk.green("\nHappy coding! 🎉\n"));
  } catch (error) {
    console.error(chalk.red("\nError:"), error?.message || "");
    process.exit(1);
  }
}

/* ----------------------- Post-Installation Instructions --------------------- */
async function displayPostInstallInstructions(
  targetDir,
  projectType,
  projectName,
) {
  const relativePath = path.relative(process.cwd(), targetDir) || ".";
  const envFile = path.join(targetDir, ".env");
  const packageJsonPath = path.join(targetDir, "package.json");

  console.log(chalk.cyan.bold("\n🚀 Project Setup Complete!"));
  console.log(chalk.cyan("\n📋 Next Steps:"));

  // Common next steps
  const commonSteps = [
    `Navigate to project directory: ${chalk.yellow(`cd ${relativePath}`)}`,
    `Install dependencies: ${chalk.yellow("npm install")}`,
    `Copy ${chalk.yellow(".env.example")} to ${chalk.yellow(".env")} and update the values`,
    `Start development server: ${chalk.yellow("npm run dev")}`,
    `Format code: ${chalk.yellow("npm run format")}`
  ];

  // Database specific steps
  const dbSteps = {
    mongodb: [
      `Ensure MongoDB is running locally or update ${chalk.yellow("MONGODB_URI")} in .env`,
      `(Optional) Create admin user: ${chalk.yellow("npm run init:admin")}`,
    ],
    sql: [
      `Set up your PostgreSQL database and update database connection in .env`,
    ],
  };

  // Combine and display all steps
  [...commonSteps, ...(dbSteps[projectType] || [])].forEach((step, index) => {
    console.log(chalk.cyan(`  ${index + 1}. ${step}`));
  });

  // Project structure highlights
  console.log(chalk.cyan("\n📁 Important Files & Directories:"));
  const importantFiles = [
    `📄 .env - Environment variables (copy from .env.example)`,
    `📄 package.json - Project dependencies and scripts`,
    `📁 src/ - Application source code`,
    `  ├── config/ - Configuration files`,
    `  ├── controllers/ - Route controllers`,
    `  ├── models/ - Database models`,
    `  ├── routes/ - API route definitions`,
    `  └── middleware/ - Express middleware`,
  ];

  importantFiles.forEach((file) => console.log(`  ${file}`));

  // Development commands
  console.log(chalk.cyan("\n🔧 Development Commands:"));
  console.log(
    chalk.yellow(`  npm run dev`),
    "     Start development server with hot-reload",
  );

  // API Documentation
  console.log(chalk.cyan("\n📚 API Documentation:"));
  console.log(
    `  After starting the server, visit: ${chalk.blue("http://localhost:8080/api/docs")}`,
  );

  // Support
  console.log(chalk.cyan("\n❓ Need Help?"));
  console.log(
    `  Check the ${chalk.yellow("README.md")} for more detailed instructions`,
  );
  console.log(
    `  Open an issue at: ${chalk.blue("https://github.com/AjayDumaraliya19/nodejs-boiler/issues")}`,
  );
}

/* ------------------------------- RUN the CLI ------------------------------ */
main().catch((error) => {
  console.error(chalk.red("\nAn unexpected error occurred:"), error);
  process.exit(1);
});

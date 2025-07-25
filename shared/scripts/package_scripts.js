#!/usr/bin/env node

const { execSync } = require("child_process");
const os = require("os");
const path = require("path");

// Detect if on Windows
const isWindows = os.platform() === "win32";

// Helper to run shell commands
function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", shell: true, ...options });
}

// === Functions ===

function say_hello() {
  console.log("Hello, world!");
}

function install_backend() {
  try {
    run("npm run check:python");
    run(
      "cd backend && python3 -m pip install --upgrade pip poetry && poetry install --with dev"
    );
    run("npm run prepare");
  } catch (err) {
    console.error("install_backend failed");
  }
}

function pre_commit_backend() {
  try {
    if (!isWindows) {
      run("poetry run python3 -m pre_commit run --all-files");
    } else {
      run("poetry run python -m pre_commit run --all-files");
    }
  } catch (err) {
    console.error("pre_commit_backend failed");
  }
}

function prepare() {
  try {
    if (!isWindows) {
      run("cd backend && poetry run python3 -m pre_commit install");
    } else {
      run("cd backend && poetry run python -m pre_commit install");
    }
  } catch (err) {
    console.error("prepare failed");
  }
}

function start_backend() {
  try {
    if (!isWindows) {
      run("cd backend && poetry run eval-assist serve --reload true");
    } else {
      run("cd backend && poetry run eval-assist serve --reload true");
    }
  } catch (err) {
    console.error("start_backend failed");
  }
}

function start_frontend() {
  const rawUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_HOST || "http://localhost:8000";
  const strippedHost = rawUrl.replace(/^https?:\/\//, ""); // Remove http:// or https://
  run(`npx wait-on http-get://${strippedHost}/api/health`);
  run("cd frontend && npm run dev");
}

// === Dispatcher ===
const actions = {
  say_hello,
  install_backend,
  pre_commit_backend,
  prepare,
  start_backend,
  start_frontend,
};

const cmd = process.argv[2];

if (!cmd || !(cmd in actions)) {
  console.error(
    `Invalid or missing command. Available commands:\n  ${Object.keys(
      actions
    ).join("\n  ")}`
  );
  process.exit(1);
}

actions[cmd]();

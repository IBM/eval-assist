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
    if (!isWindows) {
      run("python3 -m venv backend/venv");
      run(
        ". backend/venv/bin/activate && pip3 install --upgrade pip setuptools wheel && pip3 install -r backend/requirements.txt"
      );
    } else {
      run("python -m venv backend/venv");
      run(
        "backend\\venv\\Scripts\\activate && python -m pip install --upgrade pip setuptools wheel && python -m pip install -r backend/requirements.txt"
      );
    }
  } catch (err) {
    console.error("install_backend failed");
  }
}

function pre_commit_backend() {
  try {
    if (!isWindows) {
      run(
        ". backend/venv/bin/activate && python3 -m pre_commit run --all-files"
      );
    } else {
      run(
        "backend\\venv\\Scripts\\activate && python -m pre_commit run --all-files"
      );
    }
  } catch (err) {
    console.error("pre_commit_backend failed");
  }
}

function freeze_deps_backend() {
  try {
    if (!isWindows) {
      run(
        ". backend/venv/bin/activate && cd backend && python3 -m pip freeze > requirements_lock.txt"
      );
    } else {
      run(
        "backend\\venv\\Scripts\\activate && cd backend && python -m pip freeze > requirements_lock.txt"
      );
    }
  } catch (err) {
    console.error("freeze_deps_backend failed");
  }
}

function prepare() {
  try {
    if (!isWindows) {
      run("python3 -m venv backend/venv");
      run(
        ". backend/venv/bin/activate && python3 -m pip install pre-commit && python3 -m pre_commit install"
      );
    } else {
      run("python -m venv backend/venv");
      run(
        "backend\\venv\\Scripts\\activate && python -m pip install pre-commit && python -m pre_commit install"
      );
    }
  } catch (err) {
    console.error("prepare failed");
  }
}

function start_backend() {
  try {
    if (!isWindows) {
      run(". backend/venv/bin/activate && python3 backend/run.py");
    } else {
      run("backend\\venv\\Scripts\\activate && python backend/run.py");
    }
  } catch (err) {
    console.error("start_backend failed");
  }
}

function start_frontend() {
  const rawUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_HOST || "http://localhost:3000";
  const strippedHost = rawUrl.replace(/^https?:\/\//, ""); // Remove http:// or https://
  run(`npx wait-on -t 120s http-get://${strippedHost}/health`);
  run("cd frontend && npm run dev");
}

// === Dispatcher ===
const actions = {
  say_hello,
  install_backend,
  pre_commit_backend,
  freeze_deps_backend,
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

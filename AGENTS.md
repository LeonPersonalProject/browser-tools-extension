# Repository Guidelines

## Project Structure & Module Organization

This repository is a dependency-free Manifest V3 browser extension. `manifest.json` defines the extension entry point and permissions. `popup.html`, `popup.css`, and `popup.js` implement the main 800×600 interface; `fullpage.html` and `fullpage.css` provide the larger tab view. Feature logic lives in `utils/` as ES modules (`jsonFormatter.js`, `timestamp.js`, `encoder.js`, `colorPicker.js`, and `converter.js`). The injected JSON modal is implemented by `json-modal-inject.js` and `json-modal-inject.css`. Store static images in `assets/`. Keep user-facing documentation synchronized in `README.md`, `DOCS.md`, and `CHANGELOG.md` when behavior changes.

## Build, Test, and Development Commands

There is no package manager, compilation step, or external runtime dependency. Develop by loading the repository directly:

- Chrome/Edge: open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
- Firefox: open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `manifest.json`.
- After editing, reload the extension from the browser's extension page and reopen the popup.

Use `git diff --check` before submitting to catch whitespace errors. Validate `manifest.json` with `python -m json.tool manifest.json` if Python is available.

## Coding Style & Naming Conventions

Use modern, framework-free JavaScript with ES module imports/exports. Match the existing two-space indentation, semicolons, single-quoted JavaScript strings, and trailing commas only where already used. Prefer `const`, use `let` only for reassignment, and keep DOM setup grouped in focused `init*` functions. Name variables and functions in `camelCase`, utility files in `camelCase.js`, and HTML IDs/CSS classes in `kebab-case`. Reuse CSS custom properties and shared `paper`, `field`, and button classes before adding one-off values.

## Testing Guidelines

Run `node tests.mjs` for algorithm boundary tests (Node 22+). No build or package install is required. JSON parsing/sorting uses a module Worker, with a shared 5 MiB input limit and lazy tree rendering. Independent-page state moves through a memory-only background handoff, consumed once within 30 seconds; never store passwords, JWTs or drafts. The webpage modal is not a secure extension page: the host page may read its DOM. Manually smoke-test both `popup.html` and `fullpage.html` in a supported browser. Exercise every affected tool, light/dark themes, clipboard actions, error states, navigation, and the injected JSON modal. Check the browser console for errors. For permission or manifest changes, reinstall the unpacked extension and verify the full flow.

## Commit & Pull Request Guidelines

Recent history uses short, action-oriented Chinese summaries such as `优化样式` and `修复插件报错问题`. Keep each commit focused and describe the observable change. Pull requests should include a concise purpose, testing steps and browsers used, linked issues when applicable, and before/after screenshots for layout or styling changes. Call out any new permissions or host access explicitly.

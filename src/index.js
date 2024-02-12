#!/usr/bin/env node
"use strict";
const parseArgs = require("minimist");
const { loadSchemaJSON, schemaToJSON } = require("./loadSchema");
const renderSchema = require("./renderSchema");

function safeExit(code) {
  process.on("exit", function () {
    process.exit(code);
  });
}

function run(schemaPath, { exit = true } = {}) {
  const args = parseArgs(argv);
  const headers = [].concat(args.header || []).reduce((obj, header) => {
    const [key, ...value] = String(header).split("=");
    obj[key] = value.join("=");
    return obj;
  }, {});
  const loadOptions = { headers };
  loadSchemaJSON(schemaPath, loadOptions).then((schema) => {
    const options = {
      title: args.title,
      skipTitle: false,
      prologue: args.prologue,
      epilogue: args.epilogue,
      skipTableOfContents: args.toc === false,
      headingLevel: args["heading-level"],
    };
    if (options.title === false) {
      options.title = "";
      options.skipTitle = true;
    } else if (Array.isArray(options.title)) {
      options.title.forEach((value) => {
        if (typeof value === "string") {
          options.title = value;
        } else if (value === false) {
          options.skipTitle = true;
        }
      });
    }

    renderSchema(schema, options);
    if (exit) {
      safeExit(0);
    }
  });
}

module.exports = {
  run,
  loadSchemaJSON,
  schemaToJSON,
  renderSchema,
};

if (require.main === module) {
  run();
}

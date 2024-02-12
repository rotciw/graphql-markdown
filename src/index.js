#!/usr/bin/env node
"use strict";
const { loadSchemaJSON, schemaToJSON } = require("./loadSchema");
const renderSchema = require("./renderSchema");

function safeExit(code) {
  process.on("exit", function () {
    process.exit(code);
  });
}

function run(schemaPath, { exit = true } = {}) {
  loadSchemaJSON(schemaPath).then((schema) => {
    const options = {
      skipTitle: false,
      skipTableOfContents: false,
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

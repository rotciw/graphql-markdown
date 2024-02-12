#!/usr/bin/env node
"use strict";
const parseArgs = require("minimist");
const resolveFrom = require("resolve-from");
const { loadSchemaJSON, schemaToJSON } = require("./loadSchema");
const renderSchema = require("./renderSchema");

function safeExit(code) {
  process.on("exit", function () {
    process.exit(code);
  });
}

function run(
  argv = process.argv.slice(2),
  { console = global.console, exit = true } = {}
) {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp(console);
  } else if (args.version) {
    console.log(require("../package.json").version);
  } else if (args._.length === 1) {
    if (args.require) {
      const requirePath = resolveFrom(".", args.require);
      if (requirePath) {
        require(requirePath);
      } else {
        throw new Error(`Could not resolve --require module: ${args.require}`);
      }
    }
    const schemaPath = args._[0];
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
  } else {
    printHelp(console);
    if (exit) {
      safeExit(1);
    }
  }
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

"use strict";
const fs = require("fs");
const graphql = require("graphql");

const DEFAULT_GRAPHQL = graphql;

function readFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (err, data) =>
      err ? reject(err) : resolve(data)
    );
  });
}

function parseSchemaGraphQL(filename, options) {
  options = options || {};
  const graphql = options.graphql || DEFAULT_GRAPHQL;
  return readFile(filename).then((data) => graphql.buildSchema(data));
}

function schemaToJSON(schema, options) {
  options = options || {};
  const graphql = options.graphql || DEFAULT_GRAPHQL;
  const source = graphql.getIntrospectionQuery();
  return graphql.graphql({ schema, source }).then((result) => {
    return result.data;
  });
}

function loadSchemaJSON(schemaPath) {
  if (schemaPath.match(/\.g(raph)?ql$/)) {
    return parseSchemaGraphQL(schemaPath).then(schemaToJSON);
  } else {
    console.error("Not supported");
  }
  return requireSchema(schemaPath);
}

module.exports = { loadSchemaJSON, schemaToJSON };

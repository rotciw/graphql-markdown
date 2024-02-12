"use strict";
const fs = require("fs");

function sortBy(arr, property) {
  arr.sort((a, b) => {
    const aValue = a[property];
    const bValue = b[property];
    if (aValue > bValue) return 1;
    if (bValue > aValue) return -1;
    return 0;
  });
}

function renderType(type, options) {
  if (type.kind === "NON_NULL") {
    return renderType(type.ofType, options) + "!";
  }
  if (type.kind === "LIST") {
    return `[${renderType(type.ofType, options)}]`;
  }
  const url = options.getTypeURL(type);
  return url
    ? `<a href="${type.kind.toLowerCase() + "s"}${url}">${type.name}</a>`
    : type.name;
}

function renderObject(type, objectType, options) {
  let output = "";
  options = options || {};
  const skipTitle = options.skipTitle === true;
  const headingLevel = options.headingLevel || 1;
  const getTypeURL = options.getTypeURL;
  const isInputObject = type.kind === "INPUT_OBJECT";

  if (!skipTitle) {
    output += `\n${"#".repeat(headingLevel + 2)} ${type.name}\n` + "\n";
  }
  if (type.description) {
    output += `${type.description}\n` + "\n";
  }
  const fields = isInputObject ? type.inputFields : type.fields;
  fields.forEach((field) => {
    output += "<div>" + "\n\n";
    output += "#".repeat(headingLevel) + " " + field.name + "\n\n";
    output += `<label>${objectType}</label>\n` + "\n";
    output += "</div>" + "\n";
    output += "<span>\n";
    if (objectType === "query" || objectType === "mutation") {
      output +=
        "Return type is " + renderType(field.type, { getTypeURL }) + "\n";
    } else {
      output += "Type " + renderType(field.type, { getTypeURL }) + "\n";
    }
    output += "</span>\n";
    if (field.description || field.isDeprecated) {
      if (field.description) {
        output += "\n\n" + `${field.description}` + "\n";
      }
      if (field.isDeprecated) {
        output += "<blockquote>" + "\n";
        output += "\n\n<strong>DEPRECATED</strong>" + "\n\n";
        if (field.deprecationReason) {
          output += `\n${field.deprecationReason}\n` + "\n";
        }
        output += "</blockquote>" + "\n";
      }
    }
    if (!isInputObject && field.args.length) {
      output += "\n";
      output += "#### Arguments" + "\n";
      output += "| Name | Type | Description |" + "\n";
      output +=
        "| ----------------------------------------------- | ---- | ----------- |" +
        "\n";
      field.args.forEach((arg, i) => {
        output +=
          `|${arg.name}|${renderType(arg.type, { getTypeURL })}|${
            arg.description ? arg.description + "|" : "|"
          }` + "\n";
      });
      output += "---" + "\n";
    }
  });
  return output;
}

function renderSchema(schema, options) {
  options = options || {};
  const title = options.title || "Schema Types";
  const skipTitle = options.skipTitle || false;
  const skipTableOfContents = options.skipTableOfContents || false;
  const prologue = options.prologue || "";
  const epilogue = options.epilogue || "";
  const printer = options.printer || console.log;
  const headingLevel = options.headingLevel || 1;
  const unknownTypeURL = options.unknownTypeURL;

  if (schema.__schema) {
    schema = schema.__schema;
  }

  const types = schema.types.filter((type) => !type.name.startsWith("__"));
  const typeMap = schema.types.reduce((typeMap, type) => {
    return Object.assign(typeMap, { [type.name]: type });
  }, {});
  const getTypeURL = (type) => {
    const url = `#${type.name.toLowerCase()}`;
    if (typeMap[type.name]) {
      return url;
    } else if (typeof unknownTypeURL === "function") {
      return unknownTypeURL(type);
    } else if (unknownTypeURL) {
      return unknownTypeURL + url;
    }
  };

  const queryType = schema.queryType;
  const query =
    queryType && types.find((type) => type.name === schema.queryType.name);
  const mutationType = schema.mutationType;
  const mutation =
    mutationType &&
    types.find((type) => type.name === schema.mutationType.name);
  const objects = types.filter(
    (type) => type.kind === "OBJECT" && type !== query && type !== mutation
  );
  const inputs = types.filter((type) => type.kind === "INPUT_OBJECT");
  const enums = types.filter((type) => type.kind === "ENUM");
  const scalars = types.filter((type) => type.kind === "SCALAR");
  const interfaces = types.filter((type) => type.kind === "INTERFACE");
  const unions = types.filter((type) => type.kind === "UNION");

  sortBy(objects, "name");
  sortBy(inputs, "name");
  sortBy(enums, "name");
  sortBy(scalars, "name");
  sortBy(interfaces, "name");
  sortBy(unions, "name");

  if (!skipTitle) {
    printer(`${"#".repeat(headingLevel)} ${title}\n`);
  }

  if (prologue) {
    printer(`${prologue}\n`);
  }

  if (!skipTableOfContents) {
    let output = "";
    output += "<div>" + "\n";
    output += "<nav>" + "\n";
    output += "<ul>" + "\n";
    output += "<strong>Table of Contents</strong>" + "\n";
    if (query) {
      output += '<li><a href="query">Query</a></li>' + "\n";
    }
    if (mutation) {
      output += '<li><a href="mutation">Mutation</a></li>' + "\n";
    }
    if (objects.length) {
      output += '<li><a href="objects">Objects</a></li>\n' + "\n";
      output += "<ul>" + "\n";
      objects.forEach((type) => {
        output +=
          `<li><a href="objects#${type.name.toLowerCase()}">${
            type.name
          }</a> </li>` + "\n";
      });
      output += "</ul>" + "\n";
    }
    if (inputs.length) {
      output += '<li><a href="inputs">Inputs</a></li>\n' + "\n";
      output += "<ul>" + "\n";
      inputs.forEach((type) => {
        output +=
          `<li><a href="inputs#${type.name.toLowerCase()}">${
            type.name
          }</a> </li>` + "\n";
      });
      output += "</ul>" + "\n";
    }
    if (enums.length) {
      output += '<li><a href="enums">Enums</a></li>\n' + "\n";
      output += "<ul>" + "\n";
      enums.forEach((type) => {
        output +=
          `<li><a href="enums#${type.name.toLowerCase()}">${
            type.name
          }</a> </li>` + "\n";
      });
      output += "</ul>" + "\n";
    }
    if (scalars.length) {
      output += '<li><a href="scalars">Scalars</a></li>\n' + "\n";
      output += "<ul>" + "\n";
      scalars.forEach((type) => {
        output +=
          `<li><a href="scalars#${type.name.toLowerCase()}">${
            type.name
          }</a> </li>` + "\n";
      });
      output += "</ul>" + "\n";
    }
    if (interfaces.length) {
      output += '<li><a href="interfaces">Interfaces</a></li>\n' + "\n";
      output += "<ul>" + "\n";
      interfaces.forEach((type) => {
        output +=
          `<li><a href="interfaces#${type.name.toLowerCase()}">${
            type.name
          }</a> </li>` + "\n";
      });
      output += "</ul>" + "\n";
    }
    if (unions.length) {
      output += '<li><a href="unions">Unions</a></li>\n' + "\n";
      output += "<ul>" + "\n";
      unions.forEach((type) => {
        output +=
          `<li><a href="unions#${type.name.toLowerCase()}">${
            type.name
          }</a> </li>` + "\n";
      });
      output += "</ul>" + "\n";
    }
    output += "</ul>" + "\n";
    output += "</nav>" + "\n";
    output += "</div>" + "\n";

    fs.writeFileSync("toc.md", output, (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  }

  if (query) {
    let output = "";
    output +=
      `\n${"#".repeat(headingLevel + 0)} Query${
        query.name === "Query" ? "" : " (" + query.name + ")"
      }` + "\n";
    output +=
      renderObject(query, "query", {
        skipTitle: true,
        headingLevel: 2,
        printer,
        getTypeURL,
      }) + "\n";
    fs.writeFileSync("query.md", output, (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  }

  if (mutation) {
    let output = "";
    output += `\n${"#".repeat(headingLevel + 0)} Mutation${
      mutation.name === "Mutation" ? "" : " (" + mutation.name + ")"
    }`;
    output += renderObject(mutation, "mutation", {
      skipTitle: true,
      headingLevel,
      printer,
      getTypeURL,
    });
    fs.writeFileSync("mutation.md", output, (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  }

  if (objects.length) {
    let output = "";
    output += `\n${"#".repeat(headingLevel + 0)} Objects` + "\n";
    output += "---" + "\n";
    objects.forEach((type) => {
      output += "<span>" + "\n";
      output += `\n${"#".repeat(headingLevel + 1)} ${type.name}\n` + "\n";
      output += renderObject(type, "object", {
        skipTitle: true,
        headingLevel: 3,
        printer,
        getTypeURL,
      });
      output += "</span>" + "\n";
      output += "\n" + "---" + "\n";
    });
    fs.writeFileSync("objects.md", output, (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  }

  if (inputs.length) {
    let output = "";
    output += `\n${"#".repeat(headingLevel + 0)} Inputs` + "\n";
    output += "---" + "\n";
    inputs.forEach((type) => {
      output += "<span>" + "\n";
      output += `\n${"#".repeat(headingLevel + 1)} ${type.name}\n` + "\n";
      output += renderObject(type, "input", {
        skipTitle: true,
        headingLevel: 3,
        printer,
        getTypeURL,
      });
      output += "</span>" + "\n";
      output += "\n" + "---" + "\n";
    });
    fs.writeFileSync("inputs.md", output, (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  }

  if (enums.length) {
    let output = "";
    output += `\n${"#".repeat(headingLevel + 0)} Enums` + "\n";
    output += "---" + "\n";
    enums.forEach((type) => {
      output += `\n${"#".repeat(headingLevel + 1)} ${type.name}\n` + "\n";
      if (type.description) {
        output += `${type.description}\n` + "\n";
      }
      output += "<table>" + "\n";
      output += "<thead>" + "\n";
      output += "<th>Value</th>" + "\n";
      output += "<th>Description</th>" + "\n";
      output += "</thead>" + "\n";
      output += "<tbody>" + "\n";
      type.enumValues.forEach((value) => {
        output += "<tr>" + "\n";
        output +=
          `<td><strong>${value.name}</strong>${
            value.isDeprecated ? " ⚠️" : ""
          }</td>` + "\n";
        if (value.description || value.isDeprecated) {
          output += "<td>" + "\n";
          if (value.description) {
            output += `\n${value.description}\n` + "\n";
          }
          if (value.isDeprecated) {
            output += "<p>⚠️ <strong>DEPRECATED</strong></p>" + "\n";
            if (value.deprecationReason) {
              output += "<blockquote>" + "\n";
              output += `\n${value.deprecationReason}\n` + "\n";
              output += "</blockquote>" + "\n";
            }
          }
          output += "</td>" + "\n";
        } else {
          output += "<td></td>" + "\n";
        }
        output += "</tr>" + "\n";
      });
      output += "</tbody>" + "\n";
      output += "</table>" + "\n";
      output += "\n" + "---" + "\n";
    });
    fs.writeFileSync("enums.md", output, (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  }

  if (scalars.length) {
    let output = "";
    output += `\n${"#".repeat(headingLevel + 0)} Scalars\n` + "\n";
    output += "---" + "\n";
    scalars.forEach((type) => {
      output += "<div>" + "\n\n";
      output += `${"#".repeat(headingLevel + 1)} ${type.name}` + "\n";
      output += "<label>scalar</label>" + "\n\n";
      output += "</div>" + "\n";
      if (type.description) {
        output += `${type.description}\n` + "\n";
      }
      output += "\n" + "---" + "\n";
    });
    fs.writeFileSync("scalars.md", output, (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  }

  if (interfaces.length) {
    let output = "";
    output += `\n${"#".repeat(headingLevel + 0)} Interfaces\n` + "\n";
    output += "---" + "\n";
    interfaces.forEach((type) => {
      output += "<span>" + "\n";
      output += `\n${"#".repeat(headingLevel + 1)} ${type.name}\n` + "\n";
      output += renderObject(type, "interface", {
        skipTitle: true,
        headingLevel: 3,
        printer,
        getTypeURL,
      });
      output += "</span>" + "\n";
      output += "\n" + "---" + "\n";
    });
    fs.writeFileSync("interfaces.md", output, (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  }

  if (unions.length) {
    let output = "";
    output += `\n${"#".repeat(headingLevel + 0)} Unions` + "\n";
    unions.forEach((type) => {
      output += `\n${"#".repeat(headingLevel + 2)} ${type.name}\n` + "\n";
      if (type.description) {
        output += `${type.description}\n` + "\n";
      }
      output += "<table>" + "\n";
      output += "<thead>" + "\n";
      output += "<th >Type</th>" + "\n";
      output += "<th >Description</th>" + "\n";
      output += "</thead>" + "\n";
      output += "<tbody>" + "\n";
      type.possibleTypes.forEach((objType) => {
        const obj = objects.find((o) => objType.name === o.name) || {};
        const desc = objType.description || (obj && obj.description) || "";
        output += "<tr>" + "\n";
        output +=
          `<td><strong>${renderType(objType, {
            getTypeURL,
          })}</strong></td>` + "\n";
        if (desc) {
          output += `<td >${desc}</td>` + "\n";
        } else {
          output += "<td></td>" + "\n";
        }
        output += "</tr>" + "\n";
      });
      output += "</tbody>" + "\n";
      output += "</table>" + "\n";
      output += "\n" + "---" + "\n";
    });
    fs.writeFileSync("unions.md", output, (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  }

  if (epilogue) {
    output += `\n${epilogue}`;
  }
}

module.exports = renderSchema;

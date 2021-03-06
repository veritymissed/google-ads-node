const fs = require("fs");

const COMPILED_ENUMS_FILEPATH = process.argv[2];
const API_VERSION = process.argv[3];
const OUT_FILE = process.argv[4];

const file = require(__dirname + `/${COMPILED_ENUMS_FILEPATH}`);
const enums =
  file.nested.google.nested.ads.nested.googleads.nested[API_VERSION].nested.enums.nested;
const errors =
  file.nested.google.nested.ads.nested.googleads.nested[API_VERSION].nested.errors.nested;
const stream = fs.createWriteStream(OUT_FILE);

/* 
    Here we manually build Typescript enums that have no dependencies e.g. grpc messages, objects etc.
    This means these specific enums can be imported in web or non-node environments.
    The enum import name is also flattened, to reduce verbosity 
        e.g. "AccountBudgetProposalTypeEnum.AccountBudgetProposalType"
        becomes just "AccountBudgetProposalType"
*/

stream.write("/* Autogenerated File! Do Not Edit. */\n");

generateEnums(enums);
generateEnums(errors);

function generateEnums(data) {
  for (const name in data) {
    if (!name.includes("Enum")) {
      continue;
    }

    const enumDef = data[name].nested[name.replace(/Enum$/, "")].values;
    let e = `\n`;

    for (const key in enumDef) {
      const value = enumDef[key];
      e += `"${key}" = ${value},\n`;
    }

    stream.write(`\n
    /**
     * @name ${name}.${name.replace("Enum", "")}
     */
    export enum ${name.replace("Enum", "")} { ${e} }
    \n`);
  }
}

stream.end();
console.log(`Finished writing enums to ${OUT_FILE}`);

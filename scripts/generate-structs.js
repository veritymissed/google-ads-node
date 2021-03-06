const fs = require("fs");
const get = require("lodash.get");
const pb = require("protobufjs");
const snakeCase = require("lodash.snakecase");

const COMPILED_ENUMS_FILEPATH = process.argv[2];
const API_VERSION = process.argv[3];
const OUT_FILE = process.argv[4];
const BASE_PATH = `google.ads.googleads.${API_VERSION}`;

const file = require(__dirname + `/${COMPILED_ENUMS_FILEPATH}`);
const resources = getProtobufRoot(`${BASE_PATH}.resources`);
const common = getProtobufRoot(`${BASE_PATH}.common`);
const services = getProtobufRoot(`${BASE_PATH}.services`);

const stream = fs.createWriteStream(OUT_FILE);
const root = pb.loadSync(__dirname + `/${COMPILED_ENUMS_FILEPATH}`);

const pbToTsMapping = {
  bool: "boolean",
  "google.protobuf.BoolValue": "boolean",

  int64: "number",
  int32: "number",
  "google.protobuf.Int64Value": "number",
  "google.protobuf.Int32Value": "number",
  "google.protobuf.UInt64Value": "number",
  float: "number",
  double: "number",
  "google.protobuf.DoubleValue": "number",

  bytes: "string",
  string: "string",
  "google.protobuf.StringValue": "string",
  "google.protobuf.BytesValue": "string",
};

const enumImports = new Set();
const scopedInterfaces = [];
const entitiesWithEnumsOnly = [];

stream.write("/* Autogenerated File! Do Not Edit. */\n");

stream.write(`
    const string = "string";
    const boolean = "boolean";
    const number = "number";
  `);

/* Compile core types */
translateEntities(common);
translateEntities(resources);
translateEntities(services);

/* Close stream */
stream.end();

function buildNestedInterfaces(entity) {
  if (entity.nestedArray && entity.nestedArray.length > 0) {
    for (const nested of entity.nestedArray) {
      buildNestedInterfaces(nested);
    }
  }
  stream.write("\n");
  buildInterfaceType(entity);
}

function translateEntities(entities) {
  for (const i in entities) {
    const entity = root.lookup(i);

    if (entity.comment) {
      stream.write(`/* ${entity.comment} */\n`);
    }

    const isUnionType = !!entity.oneofs && entity.oneofs.value;
    if (isUnionType) {
      buildUnionType(entity);
      stream.write("\n");
      continue;
    }
    buildNestedInterfaces(entity);
  }
}

function buildUnionType(entity) {
  stream.write(`\nexport const ${entity.name} = {\n`);

  for (let i = 0; i < entity.fieldsArray.length; i++) {
    const field = entity.fieldsArray[i];
    const isFinalField = i === entity.fieldsArray.length - 1;

    const key = `${snakeCase(field.name)}`;
    const translated = translateType(field, field.name, entity.parent);

    if (translated.isEnum) {
      enumImports.add(translated.type);
    }

    let line = `${key}: ${translated.type} `;
    if (!isFinalField) line += `,\n`;

    stream.write(line);
  }

  stream.write(`\n}\n`);
}

function buildInterfaceType(entity) {
  stream.write(`/* ${entity.fullName} */\n`);
  stream.write(`// @ts-ignore\n`);
  stream.write(`export const ${entity.name} = {\n`);

  scopedInterfaces.push(entity.name);

  for (const f in entity.fields) {
    const field = entity.fields[f];

    let key = snakeCase(field.name);
    let translated = translateType(field, f, entity.parent);
    let type = translated.type;

    let t = type;
    if (translated.isEnum) {
      t = `"enum_${type}"`;
    }
    stream.write(`\n// @ts-ignore\n${key}: ${t},\n`);
  }

  stream.write(`}\n`);

  /* Build resource objects with only enum properties */
  buildEntityWithEnumsOnly(entity);
}

function buildEntityWithEnumsOnly(entity) {
  if (entity.fullName.includes("services")) {
    return;
  }

  let entityWithEnumsOnly = `\n/* ${entity.fullName} */\nexport const ${snakeCase(
    entity.name
  )} = {\n`;

  for (const f in entity.fields) {
    const field = entity.fields[f];

    let key = snakeCase(field.name);
    let translated = translateType(field, f, entity.parent);
    let type = translated.type;

    if (scopedInterfaces.includes(type)) {
      if (key === snakeCase(type)) {
        entityWithEnumsOnly += `${key},\n`;
      } else {
        entityWithEnumsOnly += `${key}: ${snakeCase(type)},\n`;
      }
      continue;
    }

    if (translated.isEnum) {
      entityWithEnumsOnly += `${key}: "${type}",\n`;
    }
  }

  entityWithEnumsOnly += `}\n`;
  entitiesWithEnumsOnly.push(entityWithEnumsOnly);
}

function translateType(field, key, parent) {
  const { type } = field;

  const mapping = pbToTsMapping[type];
  if (mapping) {
    return { type: mapping, isEnum: false };
  }

  const lookup = root.lookupTypeOrEnum(type);

  /* When the type is defined in the parent */
  if (scopedInterfaces.includes(lookup.name)) {
    return { type: lookup.name, isEnum: false };
  }
  if (
    lookup.parent &&
    field.parent &&
    lookup.parent.parent.name !== "common" &&
    lookup.parent.name === field.parent.name
  ) {
    return { type: field.type, isEnum: false };
  }

  if (lookup.parent.name === "common") {
    /* If it's a common type */
    return { type: lookup.name, isEnum: false };
  }

  /* It it's an enum type (already compiled) */
  if (lookup.fullName.includes("enums")) {
    return { type: lookup.name, isEnum: true };
  }

  if (lookup.fields) {
    let objType = "";

    for (const item of lookup.fieldsArray) {
      if (!item) return { type: "undefined", isEnum: false };
      let type = pbToTsMapping[item.type];

      //   if (!type) {
      const translated = translateType({ type: item.type }, key, parent);
      type = translated.type;
      //   }
      let itemKey = snakeCase(item.name);
      objType += `${itemKey}: ${translated.isEnum ? `"enum_${type}"` : type},\n`;
    }
    return { type: `{${objType}}`, isEnum: false };
  }

  return { type: "undefined", isEnum: false };
}

function getProtobufRoot(path) {
  const nestedPath = path.split(".").join(".nested.");
  return get(file, `nested.${nestedPath}.nested`);
}

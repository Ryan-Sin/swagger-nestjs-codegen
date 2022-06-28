#!/usr/bin/env node

const path = require("path");
const codegen = require("./lib/codegen");
const { program } = require("commander");

/**
 * Options:
 *  -s, --swagger_file <swagger_file> 참조할 Swagger Yaml 파일
 *  -p, --procjet_name <procjet_name> 새롭게 생성할 프로젝트 이름
 */

program
  .requiredOption("-s, --swagger_file <swagger_file>")
  .requiredOption("-p, --procjet_name <procjet_name>")
  .parse();

const { swagger_file, procjet_name } = program.opts();

/**
 * @author Ryan
 * @description
 */
codegen.generate({
  swagger: path.resolve(swagger_file),
  target_dir: path.resolve(procjet_name),
});

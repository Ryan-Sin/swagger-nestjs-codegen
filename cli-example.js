#!/usr/bin/env node

const path = require("path");
const codegen = require("./lib/codegen");
const { program } = require("commander");
const execSync = require("child_process").execSync;

//npm root path 조회
const npmRootPath = execSync("npm root -g").toString().trim();

/**
 * Options:
 *  -s, --swagger_file <swagger_file> 참조할 Swagger Yaml 파일
 *  -p, --procjet_name <procjet_name> 새롭게 생성할 프로젝트 이름
 */
program
  .option(
    "-s, --swagger_file <swagger_file>",
    "Swagger File",
    npmRootPath + "/@newko/swagger-nestjs-codegen/example/example.yaml"
  )
  .option(
    "-p, --procjet_name <procjet_name>",
    "Prodject Name",
    "../swagger-nestjs-codegen-example"
  )
  .parse();

const { swagger_file, procjet_name } = program.opts();

const chalk = require("chalk");
const inquirer = require("inquirer");

program.action(async (cmd, args) => {
  if (args.args.length) {
    console.log(chalk.bold.red("해당 명령어를 찾을 수 없습니다."));
    program.help(); // cli -h
  } else {
    const moduleOptions = {
      database: "not",
      databaseType: "",
      orm: "",
      cache: "not",
      cacheStorage: "",
      kafka: {},
    };

    const { database } = await inquirer.prompt([
      {
        name: "database",
        message: "Do you want to create a database module?",
        type: "list",
        default: "not",
        choices: ["not", "mysql", "mariadb", "mongodb"],
      },
    ]);

    //데이터베이스를 설정 안 한다면 다음 질문을 한다.
    if (database !== "not") {
      const { orm } = await inquirer.prompt([
        {
          name: "orm",
          message: "Are you sure you want to use the ORM module?",
          type: "list",
          default: "not",
          choices: ["not", "typeORM", "sequelize", "mongoose"],
        },
      ]);

      moduleOptions.database = database;
      moduleOptions.orm = orm;
    }

    const { kafka } = await inquirer.prompt([
      {
        name: "kafka",
        message: "Do you want to create a kafka module?",
        type: "list",
        default: "not",
        choices: ["not", "producer", "consumer", "all"],
      },
    ]);

    switch (kafka) {
      case "all":
        moduleOptions.kafka = {
          producer: true,
          consumer: true,
        };
        break;

      case "producer":
        moduleOptions.kafka = {
          producer: true,
          consumer: false,
        };
        break;

      case "consumer":
        moduleOptions.kafka = {
          producer: false,
          consumer: true,
        };
        break;

      case "not":
      default:
        moduleOptions.kafka = false;
        break;
    }

    // const { cache } = await inquirer.prompt([
    //   {
    //     name: "cache",
    //     message: "Do you want to use the cache module?",
    //     type: "list",
    //     default: "not",
    //     choices: ["not", "yes"],
    //   },
    // ]);

    // if (cache === "yes") {
    //   const { cacheStorage } = await inquirer.prompt([
    //     {
    //       name: "cacheStorage",
    //       message: "Please select cache storage.",
    //       type: "list",
    //       default: "redis",
    //       choices: ["redis"],
    //     },
    //   ]);

    //   moduleOptions.cache = cache;
    //   moduleOptions.cacheStorage = cacheStorage;
    // }

    const { confirm } = await inquirer.prompt([
      {
        name: "confirm",
        type: "confirm",
        message: "Do you want to create a project?",
      },
    ]);

    if (confirm) {
      /**
       * @author Ryan
       * @description codegen start
       */
      codegen.generate({
        swagger: path.resolve(swagger_file),
        target_dir: path.resolve(procjet_name),
        moduleOptions,
      });
    } else {
      console.log(chalk.rgb(128, 128, 128)("Exit"));
    }
  }
});

program.parse(process.argv);

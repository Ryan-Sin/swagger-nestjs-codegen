const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const xfs = require("fs.extra");
const bundler = require("./bundler");
const execSync = require("child_process").execSync;

const {
  setPascalCase,
  setCamelCase,
  setParamsMethodOption,
  setServiceParams,
  generateOperationId,
  setRoutePath,
} = require("./function");

const {
  domainGenerateFiles,
  dtoGenerateFile,
  dataGenerateFile,
  generateFile,
  databasesGenerateFile,
  kafkaGenerateFile,
} = require("./generateFiles");

const { createSchemas } = require("./components");

const { processingRequestBodyData } = require("./path-requestBody-processing");
const { processingResponseData } = require("./path-response-processing");

const codegen = module.exports;

codegen.generate = async (config) => {
  const jsonYaml = await yamlToJson(config.swagger);

  //json 데이터를 Data로 가공
  const { swaggerInfo, projectStructure, dataObjectList, dtoObjectList } =
    jsonYamlToData(jsonYaml);

  config.templates = path.resolve(__dirname, "../templates/nest-server");

  await generateDirectoryStructure(
    config,
    projectStructure,
    dataObjectList,
    dtoObjectList,
    swaggerInfo
  );

  //완성된 프로젝트 prettier를 통해 코드 정렬
  execSync(
    `cd ${config.target_dir} && npx prettier --write src/**/*.ts src/**/**/*.ts test/**/*.ts`
  );
};

/**
 * @author Ryan
 * @description yaml 파일 정보를 Json 객체로 변환한다.
 */
async function yamlToJson(yaml) {
  if (typeof yaml === "string") {
    try {
      /**
       * @author Ryan
       * @description 우리가 작성한 yaml 파일 정보를 bundler로 변환한다. 실제 데이터는 자바스크립트 객체이다.
       */
      yaml = await bundler(yaml);
    } catch (e) {
      throw e;
    }
  } else if (typeof yaml !== "object") {
    throw new Error(`Could not find a valid yaml definition: ${yaml}`);
  }

  return yaml;
}

/**
 * @author Ryan
 * @description 각 도메인 이름을 설정한다.
 *
 * @param {Object} jsonYaml yaml 파일 설정
 */
function jsonYamlToData(jsonYaml) {
  const swaggerInfo = {};

  swaggerInfo.title = jsonYaml.info.title ? jsonYaml.info.title : "";
  swaggerInfo.description = jsonYaml.info.description
    ? jsonYaml.info.description
    : "";
  swaggerInfo.version = jsonYaml.info.version ? jsonYaml.info.version : "";
  swaggerInfo.servers = [];

  if (jsonYaml.servers !== 0) {
    swaggerInfo.servers = jsonYaml.servers.map((data) => data.url);
  } else {
    swaggerInfo.servers.push("http://localhost:3000");
  }

  //프로젝트 코드젠에 사용할 데이터 객체
  const projectStructure = {};
  /**
   * @author Ryan
   * @description 전역으로 변수 선언
   */
  const appModule = new Set();

  const authorized_methods = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "COPY",
    "HEAD",
    "OPTIONS",
    "LINK",
    "UNLINK",
    "PURGE",
    "LOCK",
    "UNLOCK",
    "PROPFIND",
  ];

  let dataObjectList = [];
  let dtoObjectList = [];

  /**
   * @description Schemas 생성
   * Yaml 파일에 components와 component.schemas가 있다면 schemas 객체를 생성한다.(data Modal)
   */
  if (
    typeof jsonYaml.components !== "undefined" &&
    typeof jsonYaml.components.schemas !== "undefined"
  ) {
    dataObjectList = createSchemas(jsonYaml.components.schemas);
  }

  if (typeof jsonYaml.paths === "undefined") {
    throw new Error(`Paths undefined`);
  }

  //API 도메인 파일 분석
  _.forEach(jsonYaml.paths, (path, route) => {
    //Tags를 작성하지 않으면 Error
    if (typeof path[Object.keys(path)[0]].tags === "undefined") {
      throw new Error(`${route} => Tags undefined`);
    }

    //도메인 이름은 camelCase로 설정
    const domainName =
      typeof path[Object.keys(path)[0]].tags[0] === "undefined"
        ? "root"
        : _.camelCase(path[Object.keys(path)[0]].tags[0]);

    //필요한 도메인만 생성하기 위한 조건문
    if (typeof projectStructure[domainName] === "undefined") {
      const domainNameClass = setPascalCase(domainName);

      //app.module.ts 파일에서 사용될 도메인 이름 리스트
      projectStructure.modules = appModule.add({
        domainNameClass,
        domainFrom: _.kebabCase(domainNameClass),
      });

      projectStructure[domainName] = []; // 각 도메인별 정보를 담는 배열을 하나 생성한다.

      projectStructure[domainName].decorator_method = new Set(); // 각 도메인 별 router에서 사용되는 HTTP Method 정보를 담는 Set 클래스를 생성한다.
      projectStructure[domainName].router = []; // 각 도메인 별 router 설정 정보를 담는 배열을 생성한다.

      projectStructure[domainName].importRequestDto = []; // 컨트롤러에서 DTO 클래스를 가져올 때 사용
      projectStructure[domainName].requestDto = new Set(); // 실제 DTO 클래스 파일을 생성할 때 사용
      projectStructure[domainName].serviceImportRequestDto = []; // 서비스에 DTO 클래스를 가져올 때 사용
    }

    /**
     * @param {String} method (Ex: parameters, Body, Response 정보)
     * @param {String} method_name (Ex: get, post, put, patch)
     */
    _.forEach(path, (method, method_name) => {
      //yaml 파일에 작성된 소문자 메소드를 대문자로 변경한다.
      if (authorized_methods.indexOf(method_name.toUpperCase()) === -1) return;

      /**
       * @Post, @Get, @Put, @Delete
       * HTTP 메소드 생성, 파스칼 케이스로 변경 ('@nestjs/common' 사용될 메소드)
       */
      projectStructure[domainName].decorator_method.add(
        setPascalCase(method_name)
      );

      /**
       * @description yaml 각 path 안에 선언된 parameters, requestBody, responses 정보를 가져온다.
       */
      const parameters = method.parameters;
      const requestBody = method.requestBody;
      const responses = method.responses;

      if (typeof method.operationId === "undefined") {
        throw Error(`${route} => OperationId in undefined`);
      }

      /**
       * @description @Controller, @Service Class Method
       * 기본적으로 open api 3.0 기준으로 operationId 값이 있다면 사용 그렇지 않다면 새롭게 정의
       */
      const methodName = setCamelCase(
        method.operationId ||
          generateOperationId(method_name, route).replace(/\s/g, "-")
      );

      /**
       * @Headers, @Query, @Path와 같은 옵션 데코레이터 설정
       * HTTP 옵션 생성, 파스칼 케이스로 변경 ('@nestjs/common' 사용될 메소드)
       */
      let parameterList = [];
      let serviceParam = [];
      let requestDto = new Set();

      //파라미터 설정 시작 ============================================================ //
      if (typeof parameters !== "undefined") {
        _.each(parameters, async (param) => {
          if (typeof param["$ref"] !== "undefined") {
            if (
              param["$ref"].split("parameters/")[1] ===
              Object.keys(jsonYaml.components.parameters)[0]
            ) {
              const variable = param["$ref"].split("parameters/")[1];

              const header = jsonYaml.components.parameters[variable].in;
              const name = _.camelCase(variable);
              const type = jsonYaml.components.parameters[variable].schema.type;

              if (typeof type === "undefined") {
                throw new Error(`${route} => Parameters type undefined`);
              }

              //데코레이터 메소드
              projectStructure[domainName].decorator_method.add(
                setParamsMethodOption(header)
              );
              const spr = setServiceParams(header, name);
              if (typeof spr !== "undefined") {
                serviceParam.push({ variableName: spr, variableType: type });
              }

              parameterList.push({
                // 실제 테코레이터 메소드 기반 데이터
                in: setParamsMethodOption(header),
                headerKey: variable,
                variable: setPascalCase(variable),
                variableType: type,
              });
            }
          } else {
            //items는 배열 타입이다.
            const type =
              typeof param.schema.items !== "undefined"
                ? param.schema.items.type + "[]"
                : param.schema.type;

            if (typeof type === "undefined") {
              throw new Error(`${route} : Parameters type undefined`);
            }

            //데코레이터 메소드
            projectStructure[domainName].decorator_method.add(
              setParamsMethodOption(param.in)
            );
            const spr = setServiceParams(param.in, param.name);
            if (typeof spr !== "undefined") {
              serviceParam.push({ variableName: spr, variableType: type });
            }

            parameterList.push({
              // 실제 테코레이터 메소드 기반 데이터
              in: setParamsMethodOption(param.in),
              headerKey: param.name,
              variable: spr,
              variableType: type,
            });
          }
        });
      }
      //파라미터 설정 끝 ============================================================ //

      //Body 설정  ============================================================ //
      if (typeof requestBody !== "undefined") {
        const {
          projectStructureData,
          requestObjectList,
          serviceParamData,
          requestDtoData,
          serviceImportRequestData,
        } = processingRequestBodyData(
          jsonYaml,
          requestBody,
          projectStructure[domainName],
          dtoObjectList,
          requestDto,
          serviceParam,
          route
        );

        projectStructure[domainName].importRequestDto = projectStructureData;
        projectStructure[domainName].serviceImportRequestDto =
          serviceImportRequestData;
        dtoObjectList = requestObjectList;
        requestDto = requestDtoData;
        serviceParam = serviceParamData;
      }
      //Body 설정 끝 ============================================================ //

      //Responses 설정 시작 ============================================================ //
      let temporaryData = methodName;
      if (typeof responses !== "undefined") {
        const { projectStructureData, responsesObjectList, temporaryDatas } =
          processingResponseData(
            jsonYaml,
            responses,
            projectStructure[domainName],
            dtoObjectList,
            route
          );

        projectStructure[domainName].importRequestDto = projectStructureData;
        dtoObjectList = responsesObjectList;
        temporaryData = temporaryDatas;
      }
      //Responses 설정 끝 ============================================================ //

      //컨트롤러 import 중복 제거
      projectStructure[domainName].importRequestDto = projectStructure[
        domainName
      ].importRequestDto.filter((character, idx, arr) => {
        return (
          arr.findIndex(
            (item) =>
              item.className === character.className &&
              item.from === character.from
          ) === idx
        );
      });

      //서비스 import 중복 제거
      projectStructure[domainName].serviceImportRequestDto = projectStructure[
        domainName
      ].serviceImportRequestDto.filter((character, idx, arr) => {
        return (
          arr.findIndex(
            (item) =>
              item.className === character.className &&
              item.from === character.from
          ) === idx
        );
      });

      const appDomains = [];
      appDomains.push(methodName);

      const domainNameClass = setPascalCase(domainName);

      //도메인 엔드포인트 이름 파스칼 케이스로 변경 (@Controller() 사용)
      projectStructure[domainName].domainName = setPascalCase(domainName);

      //도메인 엔드포인트에서 사용될 정보
      projectStructure[domainName].domainInfo = {
        domainName,
        domainNameClass,
        domainFrom: _.kebabCase(domainNameClass),
      };

      //도메인 API 경로 설정
      const routePath = setRoutePath(route);

      //도메인 루트 경로를 설정 (Ex: domainName: 'HealthCheck)
      projectStructure[domainName].rootPath =
        domainName === "root" ? "/" : _.kebabCase(route.split("/")[1]);

      //라우트 정보 설정 시작 ===================================================== //
      projectStructure[domainName].router.push({
        appDomains,
        paths: routePath,
        summary:
          typeof path[method_name].summary !== "undefined"
            ? path[method_name].summary
            : "",
        description:
          typeof path[method_name].description !== "undefined"
            ? path[method_name].description
            : "",
        methodDecorator:
          "@" + _.startCase(_.camelCase(method_name)).replace(/ /g, ""),
        methodName: methodName,
        parameters: parameterList,
        requestDto: requestDto,
        temporaryData: temporaryData,
        serviceName: domainName + "Service." + methodName,
        serviceParam,
      });
    });
  });

  return { swaggerInfo, projectStructure, dataObjectList, dtoObjectList };
}

/**
 * @author Ryan
 * @description 디렉토리 구조 생성
 *
 * @param {*} config 환경설정 정보 조회
 * @param {*} projectStructure 가공 데이터
 * @param {*} dtoObjectList DTO 가공 데이터
 */
function generateDirectoryStructure(
  config,
  projectStructure,
  dataObjectList,
  dtoObjectList,
  swaggerInfo
) {
  return new Promise((resolve, reject) => {
    const target_dir = config.target_dir;
    const templates_dir = config.templates;
    const moduleOptions = config.moduleOptions;

    /**
     * @author Ryan
     * @description 내가 생성하고 싶은 프로젝트 폴더만 생성
     */
    if (!fs.existsSync(target_dir)) fs.mkdirSync(target_dir);

    /**
     * @author Ryan
     * @description 내가 생성하고 싶은 디렉토리에 템플릿 디렉토리를 카피한다.
     *
     */
    xfs.copyRecursive(templates_dir, target_dir, (err) => {
      if (err) return reject(err);

      //내가 설정한 템플릿 정보를 가져온다.
      const walker = xfs.walk(templates_dir, {
        followLinks: false,
      });

      /**
       * @author Ryan
       * @description 템플릿 안에 있는 파일들을 가져온다.
       *
       * @param root 폴더 경로 (Ex: /Users/ryan/ryan/swagger/swagger-nestjs-codegen/templates/nest-server/src)
       * @param stats 파일 정보
       */
      walker.on("file", async (root, stats, next) => {
        try {
          //내가 설정한 src/service/___.service.ts, src/module/___.module.ts, src/controller/___.controller.ts 경로 추출
          const template_path = path.relative(
            templates_dir,
            path.resolve(root, stats.name)
          );

          if (stats.name.substring(0, 3) === "___") {
            // 도메인별 파일 생성(Controller, Service, Module)
            await domainGenerateFiles({
              root,
              templates_dir,
              target_dir,
              projectStructure,
              file_name: stats.name,
            });

            //템플릿 파일을 삭제
            fs.unlink(path.resolve(target_dir, template_path), next);
            next();
          } else if (stats.name.substring(0, 3) === "---") {
            //DTO 파일 생성
            await dtoGenerateFile({
              root,
              templates_dir,
              target_dir,
              dtoObjectList,
              file_name: stats.name,
            });

            //템플릿 파일을 삭제
            fs.unlink(path.resolve(target_dir, template_path), next);
            next();
          } else if (stats.name.substring(0, 3) === "===") {
            //data 파일 생성
            await dataGenerateFile({
              root,
              templates_dir,
              target_dir,
              dataObjectList,
              file_name: stats.name,
            });

            //템플릿 파일을 삭제
            fs.unlink(path.resolve(target_dir, template_path), next);
            next();
          }
          //옵션으로 선택한 데이터 베이스 생성
          else if (stats.name.includes("database")) {
            //database 파일 생성
            await databasesGenerateFile({
              root,
              templates_dir,
              target_dir,
              file_name: stats.name,
              moduleOptions,
            });

            //템플릿 파일을 삭제
            fs.unlink(path.resolve(target_dir, template_path), next);

            next();
          } else if (template_path.includes("kafka")) {
            //kafka 파일 생성
            await kafkaGenerateFile({
              root,
              templates_dir,
              target_dir,
              file_name: stats.name,
              moduleOptions,
            });

            next();
          } else {
            //나머지 파일 생성
            await generateFile({
              root,
              templates_dir,
              target_dir,
              projectStructure,
              file_name: stats.name,
              swaggerInfo,
              moduleOptions,
            });
            next();
          }
        } catch (e) {
          reject(e);
        }
      });

      walker.on("errors", (root, nodeStatsArray) => {
        reject(nodeStatsArray);
      });

      walker.on("end", async () => {
        resolve();
      });
    });
  });
}

const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const xfs = require("fs.extra")
const bundler = require("./bundler")

const {
  setPascalCase,
  setParamsMethodOption,
  setServiceParams,
  generateOperationId,
  setRoutePath,
  classValidatorTypeSetting,
  classDtoVariableTypeSetting,
} = require("./function")

const {
  domainGenerateFiles,
  dtoGenerateFile,
  generateFile,
} = require("./generateFiles")

const codegen = module.exports

codegen.generate = async (config) => {
  const jsonYaml = await yamlToJson(config.swagger)

  //json 데이터를 Data로 가공
  const { projectStructure, dtoObjectList } = jsonYamlToData(jsonYaml)

  config.templates = path.resolve(__dirname, "../templates/nest-server")

  generateDirectoryStructure(config, projectStructure, dtoObjectList)
}

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
      yaml = await bundler(yaml)
    } catch (e) {
      throw e
    }
  } else if (typeof yaml !== "object") {
    throw new Error(`Could not find a valid yaml definition: ${yaml}`)
  }

  return yaml
}

/**
 * @author Ryan
 * @description 각 도메인 이름을 설정한다.
 *
 * @param {Object} jsonYaml yaml 파일 설정
 */
function jsonYamlToData(jsonYaml) {
  //프로젝트 코드젠에 사용할 데이터 객체
  const projectStructure = {}
  /**
   * @author Ryan
   * @description 전역으로 변수 선언
   */
  const appModule = new Set()

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
  ]

  const dtoObjectList = []

  //schemas 정보 조회
  _.forEach(jsonYaml.components.schemas, (object, objectName) => {
    //schemas 클래스 이름 설정
    dtoObjectList[objectName] = {
      className: setPascalCase(objectName),
    }

    //DTO class-validator에 사용됨
    const classValidatorList = new Set()

    //DTO 클레스 변수명과 타입을 담는
    const variableList = []

    //import DTO 클래스
    const importRequestDto = new Set()

    //Object 속성 조회
    _.forEach(object.properties, (value, key) => {
      if (typeof value.type === "undefined") {
        Object.keys(jsonYaml.components.schemas).forEach((element) => {
          if (value["$ref"].split("schemas/")[1] === element) {
            const className = setPascalCase(element)

            const variable = key + " : " + className
            variableList.push({ variable })
            importRequestDto.add(className)
          }
        })
      } else if (value.type !== "object" && value.type !== "array") {
        const classValidatorType = classValidatorTypeSetting(value.type)
        classValidatorList.add(classValidatorType)

        const variableClassValidator = "@" + classValidatorType + "()"
        const variable = key + ":" + classDtoVariableTypeSetting(value.type)

        variableList.push({ variableClassValidator, variable })
      } else if (value.type === "object") {
        if (value.items) {
          Object.keys(jsonYaml.components.schemas).forEach((element) => {
            if (value.items["$ref"].split("schemas/")[1] === element) {
              const className = setPascalCase(element)

              const variable = key + " : " + className
              variableList.push({ variable })
              importRequestDto.add(className)
            }
          })
        } else {
          const className = setPascalCase(key)
          const variable = key + " : " + className

          variableList.push({ variable })
          importRequestDto.add(className)
        }
      } else if (value.type === "array") {
        if (value.items) {
          Object.keys(jsonYaml.components.schemas).forEach((element) => {
            if (value.items["$ref"].split("schemas/")[1] === element) {
              const className = setPascalCase(element)

              const variable = key + " : " + className + "[]"
              variableList.push({ variable })
              importRequestDto.add(className)
            }
          })
        } else {
          const className = setPascalCase(key)

          const variable = key + " : " + className + "[]"
          variableList.push({ variable })
          importRequestDto.add(className)
        }
      }
    })

    dtoObjectList[objectName].variableList = variableList
    dtoObjectList[objectName].classValidatorList = classValidatorList
    dtoObjectList[objectName].importRequestDto = importRequestDto
  })

  //API 도메인 파일 분석
  _.forEach(jsonYaml.paths, (path, route) => {
    const domainName = route === "/" ? "root" : route.split("/")[1]

    //필요한 도메인만 생성하기 위한 조건문
    if (typeof projectStructure[domainName] === "undefined") {
      //app.module.ts 파일에서 사용될 도메인 이름 리스트
      const module = appModule.add(
        _.startCase(_.camelCase(domainName)).replace(/ /g, "")
      )

      projectStructure.modules = module

      projectStructure[domainName] = []
      projectStructure[domainName].decorator_method = new Set()

      projectStructure[domainName].router = []

      projectStructure[domainName].importRequestDto = new Set() // 컨트롤러에서 DTO 클래스를 가져올 때 사용
      projectStructure[domainName].requestDto = new Set() // 실제 DTO 클래스 파일을 생성할 때 사용
    }

    /**
     * @param {String} method (Ex: parameters, Body, Response 정보)
     * @param {String} method_name (Ex: get, post, put, patch)
     */
    _.each(path, (method, method_name) => {
      // console.log("path : ", path)
      //yaml 파일에 작성된 소문자 메소드를 대문자로 변경한다.
      if (authorized_methods.indexOf(method_name.toUpperCase()) === -1) return

      /**
       * @Post, @Get, @Put, @Delete
       * HTTP 메소드 생성, 파스칼 케이스로 변경 ('@nestjs/common' 사용될 메소드)
       */
      projectStructure[domainName].decorator_method.add(
        setPascalCase(method_name)
      )

      const parameters = method.parameters
      const requestBody = method.requestBody
      const responses = method.responses
      const methodName = _.camelCase(
        method.operationId ||
          generateOperationId(method_name, route).replace(/\s/g, "-")
      )

      //도메인 API 경로 설정
      const routePath = setRoutePath(domainName, route)

      /**
       * @Headers, @Query, @Path와 같은 옵션 데코레이터 설정
       * HTTP 옵션 생성, 파스칼 케이스로 변경 ('@nestjs/common' 사용될 메소드)
       */
      let parameterList = []
      const serviceParam = []

      //파라미터 설정 시작 ============================================================ //
      if (typeof parameters !== "undefined") {
        _.forEach(parameters, async (param) => {
          if (Object.keys(param)[0] === "$ref") {
            if (
              param["$ref"].split("parameters/")[1] ===
              Object.keys(jsonYaml.components.parameters)[0]
            ) {
              const variable = param["$ref"].split("parameters/")[1]

              const header = jsonYaml.components.parameters[variable].in
              const name = _.camelCase(variable)
              const type = jsonYaml.components.parameters[variable].schema.type

              //데코레이터 메소드
              projectStructure[domainName].decorator_method.add(
                setParamsMethodOption(header)
              )
              const spr = setServiceParams(header, name)
              if (typeof spr !== "undefined") {
                serviceParam.push(spr)
              }

              parameterList.push({
                // 실제 테코레이터 메소드 기반 데이터
                in: setParamsMethodOption(header),
                name,
                type,
              })
            }
          } else {
            //데코레이터 메소드
            projectStructure[domainName].decorator_method.add(
              setParamsMethodOption(param.in)
            )
            const spr = setServiceParams(param.in, param.name)
            if (typeof spr !== "undefined") {
              serviceParam.push(spr)
            }

            parameterList.push({
              // 실제 테코레이터 메소드 기반 데이터
              in: setParamsMethodOption(param.in),
              name: param.name,
              type: param.schema.type,
            })
          }
        })
      }
      //파라미터 설정 끝 ============================================================ //

      //@UsePipes(ValidationPipe) 설정 여부
      let usePipes = ""
      const requestDto = new Set()

      //Body 설정  ============================================================ //
      if (typeof requestBody !== "undefined") {
        projectStructure[domainName].decorator_method.add("Body")
        projectStructure[domainName].decorator_method.add("UsePipes")
        projectStructure[domainName].decorator_method.add("ValidationPipe")

        const object = requestBody.content["application/json"].schema

        if (Object.keys(object)[0] === "$ref") {
          Object.keys(jsonYaml.components.schemas).forEach((element) => {
            if (object["$ref"].split("schemas/")[1] === element) {
              const classVariableName = object["$ref"].split("schemas/")[1] // 클래스 변수명
              const className = setPascalCase(classVariableName) // 클래스 타입

              serviceParam.push(classVariableName)

              requestDto.add({
                classVariableName,
                className,
              })

              projectStructure[domainName].importRequestDto.add(className)
            }
          })
        }
      }
      //Body 설정 끝 ============================================================ //

      //Responses 설정 시작 ============================================================ //
      let responseType = "any"
      if (typeof responses !== "undefined") {
        if (typeof responses["200"]["$ref"] !== "undefined") {
          Object.keys(jsonYaml.components.schemas).forEach((element) => {
            if (responses["200"]["$ref"].split("schemas/")[1] === element) {
              const className = setPascalCase(element) // 클래스명

              projectStructure[domainName].importRequestDto.add(className)
              responseType = className
            }
          })
        } else if (typeof responses["200"]["content"] !== undefined) {
          if (
            typeof responses["200"]["content"]["application/json"] !==
            "undefined"
          ) {
            Object.keys(jsonYaml.components.schemas).forEach((element) => {
              if (
                responses["200"]["content"]["application/json"]["schema"][
                  "$ref"
                ].split("schemas/")[1] === element
              ) {
                const className = setPascalCase(element) // 클래스명

                projectStructure[domainName].importRequestDto.add(className)
                responseType = className
              }
            })
          }
        }
      }
      //Responses 설정 끝 ============================================================ //

      const appDomains = []
      appDomains.push(methodName)

      //도메인 엔드포인트 이름 파스칼 케이스로 변경 (@Controller() 사용)
      projectStructure[domainName].domainName = setPascalCase(domainName)

      projectStructure[domainName].domainInfo = {
        domainName,
        domainNameClass: setPascalCase(domainName),
      }

      //도메인 이름 설정 (Ex: domainName: 'HealthCheck)
      projectStructure[domainName].rootPath =
        domainName === "root" ? "/" : domainName

      //라우트 정보 설정 시작 ===================================================== //
      projectStructure[domainName].router.push({
        appDomains,
        paths: routePath,
        usePipes,
        methodDecorator:
          "@" + _.startCase(_.camelCase(method_name)).replace(/ /g, ""),
        methodName: methodName,
        parameters: parameterList,
        requestDto: requestDto,
        responseType: responseType,
        serviceName: domainName + "Service." + methodName,
        serviceParam,
      })
    })
  })

  return { projectStructure, dtoObjectList }
}

/**
 * @author Ryan
 * @description 디렉토리 구조 생성
 *
 * @param {*} config 환경설정 정보 조회
 * @param {*} projectStructure 가공 데이터
 * @param {*} dtoObjectList DTO 가공 데이터
 */
function generateDirectoryStructure(config, projectStructure, dtoObjectList) {
  new Promise((resolve, reject) => {
    const target_dir = config.target_dir
    const templates_dir = config.templates

    /**
     * @author Ryan
     * @description 내가 생성하고 싶은 프로젝트 폴더만 생성
     */
    xfs.mkdirpSync(target_dir)

    /**
     * @author Ryan
     * @description 내가 생성하고 싶은 디렉토리에 템플릿 디렉토리를 카피한다.
     *
     * 여기서부터 시간이 많이 걸린다.
     */
    xfs.copyRecursive(templates_dir, target_dir, (err) => {
      if (err) return reject(err)

      //내가 설정한 템플릿 정보를 가져온다.
      const walker = xfs.walk(templates_dir, {
        followLinks: false,
      })

      /**
       * @author Ryan
       * @description 템플릿 안에 있는 파일들을 가져온다.
       *
       * @param root 폴더 경로 (Ex: /Users/ryan/ryan/swagger/swagger-nestjs-codegen/templates/nest-server/src)
       * @param stats 파일 정보
       */
      walker.on("file", async (root, stats, next) => {
        try {
          if (stats.name.substring(0, 3) === "___") {
            // 도메인별 파일 생성(Controller, Service, Module)
            await domainGenerateFiles({
              root,
              templates_dir,
              target_dir,
              projectStructure,
              file_name: stats.name,
            })

            //내가 설정한 src/service/___.service.ts, src/module/___.module.ts, src/controller/___.controller.ts 경로 추출
            const template_path = path.relative(
              templates_dir,
              path.resolve(root, stats.name)
            )
            //템플릿 파일을 삭제
            fs.unlink(path.resolve(target_dir, template_path), next)
            next()
          } else if (stats.name.substring(0, 3) === "***") {
            //DTO 파일 생성
            await dtoGenerateFile({
              root,
              templates_dir,
              target_dir,
              dtoObjectList,
              file_name: stats.name,
            })

            const template_path = path.relative(
              templates_dir,
              path.resolve(root, stats.name)
            )
            //템플릿 파일을 삭제
            fs.unlink(path.resolve(target_dir, template_path), next)
            next()
          } else {
            //나머지 파일 생성
            await generateFile({
              root,
              templates_dir,
              target_dir,
              projectStructure,
              file_name: stats.name,
            })
            next()
          }
        } catch (e) {
          reject(e)
        }
      })

      walker.on("errors", (root, nodeStatsArray) => {
        reject(nodeStatsArray)
      })

      walker.on("end", async () => {
        resolve()
      })
    })

    resolve()
  })
}

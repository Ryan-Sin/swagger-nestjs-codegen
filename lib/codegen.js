const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const xfs = require("fs.extra")
const bundler = require("./bundler")

const {
  setPascalCase,
  setCamelCase,
  setParamsMethodOption,
  setServiceParams,
  setKebabCase,
  generateOperationId,
  setRoutePath,
  classValidatorTypeSetting,
  classDtoVariableTypeSetting,
} = require("./function")

const {
  domainGenerateFiles,
  dtoGenerateFile,
  dataGenerateFile,
  generateFile,
} = require("./generateFiles")

const {
  createSchemas,
  createRequestBodies,
  createResponse,
} = require("./components")

const codegen = module.exports

codegen.generate = async (config) => {
  const jsonYaml = await yamlToJson(config.swagger)

  //json 데이터를 Data로 가공
  const { projectStructure, dataObjectList, dtoObjectList } =
    jsonYamlToData(jsonYaml)

  config.templates = path.resolve(__dirname, "../templates/nest-server")

  generateDirectoryStructure(
    config,
    projectStructure,
    dataObjectList,
    dtoObjectList
  )
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

  let dataObjectList = []
  let dtoObjectList = []

  /**
   * @description Schemas 생성
   * Yaml 파일에 components와 component.schemas가 있다면 schemas 객체를 생성한다.(data Modal)
   */
  if (
    typeof jsonYaml.components !== "undefined" &&
    typeof jsonYaml.components.schemas !== "undefined"
  ) {
    dataObjectList = createSchemas(jsonYaml.components.schemas)
  }

  /**
   * @description requestBodies 생성
   *
   */
  if (
    typeof jsonYaml.components !== "undefined" &&
    typeof jsonYaml.components.requestBodies !== "undefined"
  ) {
    dtoObjectList = createRequestBodies(
      jsonYaml.components.requestBodies,
      jsonYaml.components.schemas,
      dtoObjectList
    )
  }

  if (
    typeof jsonYaml.components !== "undefined" &&
    typeof jsonYaml.components.responses !== "undefined" &&
    typeof jsonYaml.components.schemas !== "undefined"
  ) {
    dtoObjectList = createResponse(
      jsonYaml.components.responses,
      jsonYaml.components.schemas,
      dtoObjectList
    )
  }

  if (typeof jsonYaml.paths === "undefined") {
    throw new Error(`Paths undefined`)
  }

  //API 도메인 파일 분석
  _.forEach(jsonYaml.paths, (path, route) => {
    // //Tags를 작성하지 않으면 Error
    // if (typeof path[Object.keys(path)].tags === "undefined") {
    //   throw new Error(`${route} => Tags undefined`)
    // }

    //도메인 이름은 camelCase로 설정
    const domainName =
      typeof path[Object.keys(path)].tags === "undefined"
        ? "root"
        : _.camelCase(path[Object.keys(path)].tags[0])

    //필요한 도메인만 생성하기 위한 조건문
    if (typeof projectStructure[domainName] === "undefined") {
      const domainNameClass = setPascalCase(domainName)

      //app.module.ts 파일에서 사용될 도메인 이름 리스트
      projectStructure.modules = appModule.add({
        domainNameClass,
        domainFrom: setKebabCase(domainNameClass),
      })

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
    _.forEach(path, (method, method_name) => {
      //yaml 파일에 작성된 소문자 메소드를 대문자로 변경한다.
      if (authorized_methods.indexOf(method_name.toUpperCase()) === -1) return

      /**
       * @Post, @Get, @Put, @Delete
       * HTTP 메소드 생성, 파스칼 케이스로 변경 ('@nestjs/common' 사용될 메소드)
       */
      projectStructure[domainName].decorator_method.add(
        setPascalCase(method_name)
      )

      /**
       * @description yaml 각 path 안에 선언된 parameters, requestBody, responses 정보를 가져온다.
       */
      const parameters = method.parameters
      const requestBody = method.requestBody
      const responses = method.responses

      // if (typeof method.operationId === "undefined") {
      //   throw Error(`${route} => OperationId in undefined`)
      // }

      /**
       * @description @Controller, @Service Class Method
       * 기본적으로 open api 3.0 기준으로 operationId 값이 있다면 사용 그렇지 않다면 새롭게 정의
       */
      const methodName = setCamelCase(
        method.operationId ||
          generateOperationId(method_name, route).replace(/\s/g, "-")
      )

      /**
       * @Headers, @Query, @Path와 같은 옵션 데코레이터 설정
       * HTTP 옵션 생성, 파스칼 케이스로 변경 ('@nestjs/common' 사용될 메소드)
       */
      let parameterList = []
      const serviceParam = []

      //파라미터 설정 시작 ============================================================ //
      if (typeof parameters !== "undefined") {
        _.each(parameters, async (param) => {
          if (typeof param["$ref"] !== "undefined") {
            if (
              param["$ref"].split("parameters/")[1] ===
              Object.keys(jsonYaml.components.parameters)[0]
            ) {
              const variable = param["$ref"].split("parameters/")[1]

              const header = jsonYaml.components.parameters[variable].in
              const name = _.camelCase(variable)
              const type = jsonYaml.components.parameters[variable].schema.type

              if (typeof type === "undefined") {
                throw new Error(`${route} => Parameters type undefined`)
              }

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
                headerKey: variable,
                variable: setPascalCase(variable),
                variableType: type,
              })
            }
          } else {
            //items는 배열 타입이다.
            const type =
              typeof param.schema.items !== "undefined"
                ? param.schema.items.type + "[]"
                : param.schema.type

            if (typeof type === "undefined") {
              throw new Error(`${route} : Parameters type undefined`)
            }

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
              headerKey: param.name,
              variable: spr,
              variableType: type,
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

        //component schemas에 선언하지 않고 독립적으로 선언했다면 x-codegen-request-body-name으로 클래스 이름을 선언한다.
        if (typeof requestBody["x-codegen-request-body-name"] !== "undefined") {
          if (typeof requestBody.content === "undefined") {
            throw new Error(
              `${domainName} => ${route} paths requestBody content undefined`
            )
          }

          const className = setPascalCase(
            requestBody["x-codegen-request-body-name"]
          )

          //schemas 클래스 이름 설정
          dtoObjectList[className] = {
            className,
          }

          //DTO class-validator에 사용됨
          const classValidatorList = new Set()

          //DTO 클레스 변수명과 타입을 담는
          const variableList = []

          //import DTO 클래스
          const importRequestDto = new Set()

          const object =
            requestBody.content["application/json"].schema.properties

          const variableDescription = requestBody.description

          //새로운 data model을 생성
          for (const key in object) {
            if (Object.hasOwnProperty.call(object, key)) {
              const element = object[key]

              if (typeof element === "undefined") {
                throw Error(`${className} => object key undefined`)
              }

              if (typeof element.type === "undefined") {
                throw Error(`${className} => object type undefined`)
              }

              let variable

              if (typeof element.items !== "undefined") {
                if (typeof element.items["$ref"] === "undefined") {
                  throw Error(`${className} - object items $ref undefined`)
                }

                variable =
                  setCamelCase(key) +
                  " : " +
                  setPascalCase(element.items["$ref"].split("schemas/")[1]) +
                  "[]"

                variableList.push({ variable, variableDescription })

                importRequestDto.add(
                  setPascalCase(element.items["$ref"].split("schemas/")[1])
                )
              } else {
                const type = element.type

                const classValidatorType = classValidatorTypeSetting(type)
                classValidatorList.add(classValidatorType)

                const variableClassValidator = "@" + classValidatorType + "()"
                variable = setCamelCase(key) + " : " + type

                variableList.push({
                  variableClassValidator,
                  variable,
                  variableDescription,
                })
              }
            }
          }

          dtoObjectList[className].variableList = variableList
          dtoObjectList[className].classValidatorList = classValidatorList
          dtoObjectList[className].importRequestDto = importRequestDto

          //@Controller와 @Service에서 사용될 부분
          //클래스 변수명
          const classVariableName = _.camelCase(
            requestBody["x-codegen-request-body-name"]
          )

          serviceParam.push(classVariableName)

          //메서드 파라미터 정보 설정
          requestDto.add({
            classVariableName,
            className, //클래스 이름 및 타입
          })

          projectStructure[domainName].importRequestDto.add({
            className,
            from: `../dto/${className}.dto`,
          })
        }
        //$ref를 참조 한다면
        else if (typeof requestBody["$ref"] !== "undefined") {
          const componentsType = requestBody["$ref"].split("/")[2]

          Object.keys(jsonYaml.components[componentsType]).forEach(
            (element) => {
              if (
                requestBody["$ref"].split(`${componentsType}/`)[1] === element
              ) {
                // 클래스 변수명
                const className = requestBody["$ref"].split(
                  `${componentsType}/`
                )[1]

                const componentPath =
                  componentsType === "schemas"
                    ? `../dto/data/${className}.data`
                    : "requestBodies"
                    ? `../dto/${className}.dto`
                    : null

                if (componentPath === null) {
                  throw Error("requestBody $ref path fail")
                }

                //클래스 이름 및 타입
                const classVariableName = setCamelCase(className)

                serviceParam.push(classVariableName)

                requestDto.add({
                  classVariableName,
                  className: setPascalCase(className),
                })

                projectStructure[domainName].importRequestDto.add({
                  className,
                  from: componentPath,
                })
              }
            }
          )
        }
        // 그렇지 않다면
        else if (
          typeof requestBody.content["application/json"] !== "undefined"
        ) {
          const componentsType =
            requestBody.content["application/json"].schema["$ref"].split("/")[2]

          Object.keys(jsonYaml.components[componentsType]).forEach(
            (element) => {
              if (
                requestBody.content["application/json"].schema["$ref"].split(
                  `${componentsType}/`
                )[1] === element
              ) {
                // 클래스 변수명
                const className = requestBody.content[
                  "application/json"
                ].schema["$ref"].split(`${componentsType}/`)[1]

                const componentPath =
                  componentsType === "schemas"
                    ? `../dto/data/${className}.data`
                    : "requestBodies"
                    ? `../dto/${className}.dto`
                    : null

                if (componentPath === null) {
                  throw Error("requestBody $ref path fail")
                }

                //클래스 이름 및 타입
                const classVariableName = setCamelCase(className)

                serviceParam.push(classVariableName)

                requestDto.add({
                  classVariableName,
                  className: setPascalCase(className),
                })

                projectStructure[domainName].importRequestDto.add({
                  className,
                  from: componentPath,
                })
              }
            }
          )
        }
      }
      //Body 설정 끝 ============================================================ //

      //Responses 설정 시작 ============================================================ //
      let temporaryData = methodName
      if (typeof responses !== "undefined") {
        if (
          typeof responses["200"]["x-codegen-request-body-name"] !== "undefined"
        ) {
          const className = setPascalCase(
            responses["200"]["x-codegen-request-body-name"]
          )

          //schemas 클래스 이름 설정
          dtoObjectList[className] = {
            className,
          }

          //DTO class-validator에 사용됨
          const classValidatorList = new Set()

          //DTO 클레스 변수명과 타입을 담는
          const variableList = []

          //import DTO 클래스
          const importRequestDto = new Set()

          if (typeof responses["200"].content !== "undefined") {
            _.forEach(responses["200"].content, (mediaType) => {
              _.forEach(mediaType, (schema) => {
                if (typeof schema.items !== "undefined") {
                  if (schema.type !== "array") {
                    throw Error("response schema items type not array")
                  }

                  if (typeof schema.items.properties !== "undefined") {
                    _.forEach(schema.items.properties, (value, key) => {
                      const variableDescription = value.description
                      const varibaleExample = value.example

                      const classValidatorType = classValidatorTypeSetting(
                        value.type
                      )

                      classValidatorList.add(classValidatorType)

                      const variableClassValidator =
                        "@" + classValidatorType + "()"
                      const variable =
                        setCamelCase(key) +
                        ":" +
                        classDtoVariableTypeSetting(value.type)

                      variableList.push({
                        variableClassValidator,
                        variable,
                        variableDescription,
                        varibaleExample,
                      })
                    })
                  } else if (typeof schema.items["$ref"] !== "undefined") {
                    const componentPath = schema.items["$ref"].split("/")

                    _.forEach(
                      jsonYaml.components[componentPath[2]],
                      (componentInfo, componentkey) => {
                        if (componentPath[3] === componentkey) {
                          _.forEach(componentInfo.properties, (value, key) => {
                            const variableDescription = value.description
                            let varibaleExample = value.example

                            if (typeof value["$ref"] !== "undefined") {
                              const className =
                                typeof value.items !== "undefined"
                                  ? setPascalCase(
                                      value.items["$ref"].split("/")[3]
                                    )
                                  : setPascalCase(value["$ref"].split("/")[3])

                              const variableType =
                                value.type === "object"
                                  ? className
                                  : className + "[]"

                              varibaleExample =
                                value.type === "object"
                                  ? {
                                      className,
                                    }
                                  : [className]

                              const variable =
                                setCamelCase(key) + ":" + variableType

                              variableList.push({
                                variable,
                                variableDescription,
                                varibaleExample,
                              })

                              importRequestDto.add(setPascalCase(variableType))
                            } else {
                              const classValidatorType =
                                classValidatorTypeSetting(value.type)

                              classValidatorList.add(classValidatorType)

                              const variableClassValidator =
                                "@" + classValidatorType + "()"
                              const variable =
                                setCamelCase(key) +
                                ":" +
                                classDtoVariableTypeSetting(value.type)

                              variableList.push({
                                variableClassValidator,
                                variable,
                                variableDescription,
                                varibaleExample,
                              })
                            }
                          })
                        }
                      }
                    )
                  }
                }
                //타입이 object라면
                else if (schema.type === "object") {
                  if (typeof schema.items !== "undefined") {
                    throw Error("response schema object type array")
                  }

                  if (typeof schema.properties !== "undefined") {
                    _.forEach(schema.properties, (value, key) => {
                      const variableDescription = value.description
                      let varibaleExample = value.example

                      if (typeof value.items !== "undefined") {
                        const componentsType = value.items["$ref"].split("/")[2]

                        Object.keys(
                          jsonYaml.components[componentsType]
                        ).forEach((element) => {
                          if (
                            value.items["$ref"].split(
                              componentsType + "/"
                            )[1] === element
                          ) {
                            const className = setPascalCase(element) // 클래스명

                            const variable =
                              setCamelCase(key) + ":" + className + "[]"

                            varibaleExample = [className]

                            variableList.push({
                              variable,
                              variableDescription,
                              varibaleExample,
                            })

                            importRequestDto.add(className)
                          }
                        })
                      } else if (value.type === "object") {
                        const componentsType = value["$ref"].split("/")[2]

                        Object.keys(
                          jsonYaml.components[componentsType]
                        ).forEach((element) => {
                          if (
                            value["$ref"].split(componentsType + "/")[1] ===
                            element
                          ) {
                            const className = setPascalCase(element) // 클래스명

                            let variable = setCamelCase(key) + ":" + className

                            varibaleExample = {
                              className,
                            }

                            variableList.push({
                              variable,
                              variableDescription,
                              varibaleExample,
                            })

                            importRequestDto.add(className)
                          }
                        })
                      } else if (typeof value.properties !== "undefined") {
                        throw Error(`${route} => value.properties not setting`)
                      } else {
                        const classValidatorType = classValidatorTypeSetting(
                          value.type
                        )

                        classValidatorList.add(classValidatorType)

                        const variableClassValidator =
                          "@" + classValidatorType + "()"
                        const variable =
                          setCamelCase(key) +
                          ":" +
                          classDtoVariableTypeSetting(value.type)

                        variableList.push({
                          variableClassValidator,
                          variable,
                          variableDescription,
                          varibaleExample,
                        })
                      }
                    })
                  }

                  //schema $ref가 한 개일때
                  else if (typeof schema["$ref"] !== "undefined") {
                    const componentPath = schema["$ref"].split("/")

                    _.forEach(
                      jsonYaml.components[componentPath[2]],
                      (componentInfo, componentkey) => {
                        if (componentPath[3] === componentkey) {
                          _.forEach(componentInfo.properties, (value, key) => {
                            const variableDescription = value.description
                            let varibaleExample = value.example

                            if (typeof value["$ref"] !== "undefined") {
                              const className =
                                typeof value.items !== "undefined"
                                  ? setPascalCase(
                                      value.items["$ref"].split("/")[3]
                                    )
                                  : setPascalCase(value["$ref"].split("/")[3])

                              const variableType =
                                value.type === "object"
                                  ? className
                                  : className + "[]"

                              varibaleExample =
                                value.type === "object"
                                  ? {
                                      className,
                                    }
                                  : [className]

                              const variable =
                                setCamelCase(key) + ":" + variableType

                              variableList.push({
                                variable,
                                variableDescription,
                                varibaleExample,
                              })

                              importRequestDto.add(setPascalCase(variableType))
                            } else {
                              const classValidatorType =
                                classValidatorTypeSetting(value.type)

                              classValidatorList.add(classValidatorType)

                              const variableClassValidator =
                                "@" + classValidatorType + "()"
                              const variable =
                                setCamelCase(key) +
                                ":" +
                                classDtoVariableTypeSetting(value.type)

                              variableList.push({
                                variableClassValidator,
                                variable,
                                variableDescription,
                                varibaleExample,
                              })
                            }
                          })
                        }
                      }
                    )
                  }
                }
                //type을 설정하지 않았다면
                else if (typeof schema.type === "undefined") {
                  if (typeof schema.properties !== "undefined") {
                    _.forEach(schema.properties, (value, key) => {
                      const variableDescription = value.description
                      let varibaleExample = value.example
                      if (typeof value.items !== "undefined") {
                        const componentsType = value.items["$ref"].split("/")

                        Object.keys(
                          jsonYaml.components[componentsType[2]]
                        ).forEach((element) => {
                          if (componentsType[3] === element) {
                            const className = setPascalCase(element) // 클래스명

                            const variable =
                              setCamelCase(key) + ":" + className + "[]"

                            varibaleExample = [className]

                            variableList.push({
                              variable,
                              variableDescription,
                              varibaleExample,
                            })

                            importRequestDto.add(className)
                          }
                        })
                      } else if (value.type === "object") {
                        const componentsType = value["$ref"].split("/")

                        Object.keys(
                          jsonYaml.components[componentsType[2]]
                        ).forEach((element) => {
                          if (componentsType[3] === element) {
                            const className = setPascalCase(element) // 클래스명

                            const variable = setCamelCase(key) + ":" + className

                            varibaleExample = {
                              className,
                            }

                            variableList.push({
                              variable,
                              variableDescription,
                              varibaleExample,
                            })

                            importRequestDto.add(className)
                          }
                        })
                      } else if (typeof value.properties !== "undefined") {
                        throw Error(`${route} => value.properties not setting`)
                      } else {
                        const classValidatorType = classValidatorTypeSetting(
                          value.type
                        )

                        classValidatorList.add(classValidatorType)

                        const variableClassValidator =
                          "@" + classValidatorType + "()"
                        const variable =
                          setCamelCase(key) +
                          ":" +
                          classDtoVariableTypeSetting(value.type)

                        variableList.push({
                          variableClassValidator,
                          variable,
                          variableDescription,
                          varibaleExample,
                        })
                      }
                    })
                  } else if (typeof schema["$ref"] !== "undefined") {
                    const componentPath = schema["$ref"].split("/")

                    _.forEach(
                      jsonYaml.components[componentPath[2]],
                      (componentInfo, componentkey) => {
                        if (componentPath[3] === componentkey) {
                          _.forEach(componentInfo.properties, (value, key) => {
                            const variableDescription = value.description
                            let varibaleExample = value.example

                            if (typeof value["$ref"] !== "undefined") {
                              const className =
                                typeof value.items !== "undefined"
                                  ? setPascalCase(
                                      value.items["$ref"].split("/")[3]
                                    )
                                  : setPascalCase(value["$ref"].split("/")[3])

                              const variableType =
                                value.type === "object"
                                  ? className
                                  : className + "[]"

                              varibaleExample =
                                value.type === "object"
                                  ? {
                                      className,
                                    }
                                  : [className]

                              const variable =
                                setCamelCase(key) + ":" + variableType

                              variableList.push({
                                variable,
                                variableDescription,
                                varibaleExample,
                              })

                              importRequestDto.add(setPascalCase(variableType))
                            } else {
                              const classValidatorType =
                                classValidatorTypeSetting(value.type)

                              classValidatorList.add(classValidatorType)

                              const variableClassValidator =
                                "@" + classValidatorType + "()"
                              const variable =
                                setCamelCase(key) +
                                ":" +
                                classDtoVariableTypeSetting(value.type)

                              variableList.push({
                                variableClassValidator,
                                variable,
                                variableDescription,
                                varibaleExample,
                              })
                            }
                          })
                        }
                      }
                    )
                  }
                }
                //schema properties 값이 없을 때
                else {
                  if (typeof mediaType.schema.properties === "undefined") {
                    const variableDescription = mediaType.schema.description
                    const varibaleExample = mediaType.schema.example

                    const classValidatorType = classValidatorTypeSetting(
                      mediaType.schema.type
                    )

                    classValidatorList.add(classValidatorType)

                    const variableClassValidator =
                      "@" + classValidatorType + "()"
                    const variable =
                      setCamelCase(mediaType.schema.type) +
                      ":" +
                      classDtoVariableTypeSetting(mediaType.schema.type)

                    variableList.push({
                      variableClassValidator,
                      variable,
                      variableDescription,
                      varibaleExample,
                    })
                  }
                }

                temporaryData = { className }

                projectStructure[domainName].importRequestDto.add({
                  className,
                  from: `../dto/${className}.dto`,
                })
              })
            })
          } else if (
            typeof responses["200"].content === "undefined" &&
            typeof responses["200"]["$ref"] !== "undefined"
          ) {
            const componentPath = responses["200"]["$ref"].split("/")

            _.forEach(
              jsonYaml.components[componentPath[2]],
              (componentInfo, componentkey) => {
                if (componentPath[3] === componentkey) {
                  if (typeof componentInfo.properties !== "undefined") {
                    _.forEach(componentInfo.properties, (value, key) => {
                      const variableDescription = value.description
                      let varibaleExample = value.example
                      if (typeof value.items !== "undefined") {
                        const componentsType = value.items["$ref"].split("/")

                        Object.keys(
                          jsonYaml.components[componentsType[2]]
                        ).forEach((element) => {
                          if (componentsType[3] === element) {
                            const className = setPascalCase(element) // 클래스명

                            const variable =
                              setCamelCase(key) + ":" + className + "[]"

                            varibaleExample = [className]

                            variableList.push({
                              variable,
                              variableDescription,
                              varibaleExample,
                            })

                            importRequestDto.add(className)
                          }
                        })
                      } else if (value.type === "object") {
                        const componentsType = value["$ref"].split("/")

                        Object.keys(
                          jsonYaml.components[componentsType[2]]
                        ).forEach((element) => {
                          if (componentsType[3] === element) {
                            const className = setPascalCase(element) // 클래스명

                            const variable = setCamelCase(key) + ":" + className

                            varibaleExample = {
                              className,
                            }

                            variableList.push({
                              variable,
                              variableDescription,
                              varibaleExample,
                            })

                            importRequestDto.add(className)
                          }
                        })
                      } else if (typeof value.properties !== "undefined") {
                        throw Error(`${route} => value.properties not setting`)
                      } else {
                        const classValidatorType = classValidatorTypeSetting(
                          value.type
                        )

                        classValidatorList.add(classValidatorType)

                        const variableClassValidator =
                          "@" + classValidatorType + "()"
                        const variable =
                          setCamelCase(key) +
                          ":" +
                          classDtoVariableTypeSetting(value.type)

                        variableList.push({
                          variableClassValidator,
                          variable,
                          variableDescription,
                          varibaleExample,
                        })
                      }
                    })
                  } else if (typeof componentInfo.properties === "undefined") {
                    _.forEach(
                      componentInfo.content,
                      (contentValue, contentKey) => {
                        if (
                          typeof componentInfo.content[contentKey] !==
                          "undefined"
                        ) {
                          _.forEach(
                            componentInfo.content[contentKey],
                            (value, key) => {
                              const variableDescription = value.description
                              let varibaleExample = value.example
                              if (typeof value.items !== "undefined") {
                                const componentsType =
                                  value.items["$ref"].split("/")

                                Object.keys(
                                  jsonYaml.components[componentsType[2]]
                                ).forEach((element) => {
                                  if (componentsType[3] === element) {
                                    const className = setPascalCase(element) // 클래스명

                                    const variable =
                                      setCamelCase(key) + ":" + className + "[]"

                                    varibaleExample = [className]

                                    console.log(
                                      "varibaleExample : ",
                                      varibaleExample
                                    )

                                    variableList.push({
                                      variable,
                                      variableDescription,
                                      varibaleExample,
                                    })

                                    importRequestDto.add(className)
                                  }
                                })
                              } else if (value.type === "object") {
                                if (typeof value.properties !== "undefined") {
                                  _.forEach(value.properties, (value, key) => {
                                    const variableDescription =
                                      value.description
                                    let varibaleExample = value.example

                                    if (
                                      typeof value["$ref"] !== "undefined" ||
                                      typeof value.items !== "undefined"
                                    ) {
                                      //수정 완료 본
                                      const className =
                                        typeof value.items !== "undefined"
                                          ? setPascalCase(
                                              value.items["$ref"].split("/")[3]
                                            )
                                          : setPascalCase(
                                              value["$ref"].split("/")[3]
                                            )

                                      const variableType =
                                        value.type === "object"
                                          ? className
                                          : className + "[]"

                                      varibaleExample =
                                        value.type === "object"
                                          ? {
                                              className,
                                            }
                                          : [className]

                                      const variable =
                                        setCamelCase(key) + ":" + variableType

                                      variableList.push({
                                        variable,
                                        variableDescription,
                                        varibaleExample,
                                      })

                                      importRequestDto.add(
                                        setPascalCase(variableType)
                                      )
                                    } else {
                                      const classValidatorType =
                                        classValidatorTypeSetting(value.type)

                                      classValidatorList.add(classValidatorType)

                                      const variableClassValidator =
                                        "@" + classValidatorType + "()"
                                      const variable =
                                        setCamelCase(key) +
                                        ":" +
                                        classDtoVariableTypeSetting(value.type)

                                      variableList.push({
                                        variableClassValidator,
                                        variable,
                                        variableDescription,
                                        varibaleExample,
                                      })
                                    }
                                  })
                                } else {
                                  const componentsType =
                                    value["$ref"].split("/")

                                  Object.keys(
                                    jsonYaml.components[componentsType[2]]
                                  ).forEach((element) => {
                                    if (componentsType[3] === element) {
                                      const className = setPascalCase(element) // 클래스명

                                      const variable =
                                        setCamelCase(key) + ":" + className
                                      varibaleExample = {
                                        className,
                                      }

                                      variableList.push({
                                        variable,
                                        variableDescription,
                                        varibaleExample,
                                      })

                                      importRequestDto.add(className)
                                    }
                                  })
                                }
                              } else if (
                                typeof value.properties !== "undefined"
                              ) {
                                throw Error(
                                  `${route} => value.properties not setting`
                                )
                              } else {
                                const classValidatorType =
                                  classValidatorTypeSetting(value.type)

                                classValidatorList.add(classValidatorType)

                                const variableClassValidator =
                                  "@" + classValidatorType + "()"
                                const variable =
                                  setCamelCase(key) +
                                  ":" +
                                  classDtoVariableTypeSetting(value.type)

                                variableList.push({
                                  variableClassValidator,
                                  variable,
                                  variableDescription,
                                  varibaleExample,
                                })
                              }
                            }
                          )
                        } else if (
                          typeof componentInfo.content[contentKey] !==
                          "undefined"
                        ) {
                          const componentPath =
                            componentInfo.content[contentKey]["$ref"].split("/")

                          _.forEach(
                            jsonYaml.components[componentPath[2]],
                            (componentInfo, componentkey) => {
                              if (componentPath[3] === componentkey) {
                                _.forEach(
                                  componentInfo.properties,
                                  (value, key) => {
                                    const variableDescription =
                                      value.description
                                    let varibaleExample = value.example

                                    if (typeof value["$ref"] !== "undefined") {
                                      const className =
                                        typeof value.items !== "undefined"
                                          ? setPascalCase(
                                              value.items["$ref"].split("/")[3]
                                            )
                                          : setPascalCase(
                                              value["$ref"].split("/")[3]
                                            )

                                      const variableType =
                                        value.type === "object"
                                          ? className
                                          : className + "[]"

                                      varibaleExample =
                                        value.type === "object"
                                          ? {
                                              className,
                                            }
                                          : [className]

                                      const variable =
                                        setCamelCase(key) + ":" + variableType
                                      variableList.push({
                                        variable,
                                        variableDescription,
                                        varibaleExample,
                                      })

                                      importRequestDto.add(
                                        setPascalCase(variableType)
                                      )
                                    } else {
                                      const classValidatorType =
                                        classValidatorTypeSetting(value.type)

                                      classValidatorList.add(classValidatorType)

                                      const variableClassValidator =
                                        "@" + classValidatorType + "()"
                                      const variable =
                                        setCamelCase(key) +
                                        ":" +
                                        classDtoVariableTypeSetting(value.type)

                                      variableList.push({
                                        variableClassValidator,
                                        variable,
                                        variableDescription,
                                        varibaleExample,
                                      })
                                    }
                                  }
                                )
                              }
                            }
                          )
                        }
                      }
                    )
                  }
                }
              }
            )

            temporaryData = { className }

            projectStructure[domainName].importRequestDto.add({
              className,
              from: `../dto/${className}.dto`,
            })
          }

          dtoObjectList[className].variableList = variableList
          dtoObjectList[className].classValidatorList = classValidatorList
          dtoObjectList[className].importRequestDto = importRequestDto
        }

        /**
         * @description
         *  x-codegen-request-body-name(Response 이름)을 설정하지 않으면 에러
         */

        if (
          typeof responses["200"]["x-codegen-request-body-name"] === "undefined"
        ) {
          throw Error(`${route} => x-codegen-request-body-name Not defined `)
        }
      }
      //Responses 설정 끝 ============================================================ //

      const appDomains = []
      appDomains.push(methodName)

      const domainNameClass = setPascalCase(domainName)

      //도메인 엔드포인트 이름 파스칼 케이스로 변경 (@Controller() 사용)
      projectStructure[domainName].domainName = setPascalCase(domainName)

      //도메인 엔드포인트에서 사용될 정보
      projectStructure[domainName].domainInfo = {
        domainName,
        domainNameClass,
        domainFrom: setKebabCase(domainNameClass),
      }

      //도메인 API 경로 설정
      const routePath = setRoutePath(route)

      //도메인 루트 경로를 설정 (Ex: domainName: 'HealthCheck)
      projectStructure[domainName].rootPath =
        domainName === "root" ? "/" : setKebabCase(route.split("/")[1])

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
        usePipes,
        methodDecorator:
          "@" + _.startCase(_.camelCase(method_name)).replace(/ /g, ""),
        methodName: methodName,
        parameters: parameterList,
        requestDto: requestDto,
        temporaryData: temporaryData,
        serviceName: domainName + "Service." + methodName,
        serviceParam,
      })
    })
  })

  return { projectStructure, dataObjectList, dtoObjectList }
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
  dtoObjectList
) {
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
          } else if (stats.name.substring(0, 3) === "---") {
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
          } else if (stats.name.substring(0, 3) === "===") {
            //data 파일 생성
            await dataGenerateFile({
              root,
              templates_dir,
              target_dir,
              dataObjectList,
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

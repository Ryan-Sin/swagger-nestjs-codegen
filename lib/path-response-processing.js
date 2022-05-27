const _ = require("lodash")

const {
  setPascalCase,
  setCamelCase,
  classValidatorTypeSetting,
  classDtoVariableTypeSetting,
} = require("./function")

function processingResponseData(
  jsonYaml,
  responses,
  projectStructure,
  dtoObjectList,
  route
) {
  /**
   * @description
   *  x-codegen-request-body-name(Response 이름)을 설정하지 않으면 에러
   */
  if (typeof responses["200"]["x-codegen-request-body-name"] === "undefined") {
    throw Error(
      `${route} => path response x-codegen-request-body-name undefined `
    )
  } else if (
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

    if (typeof responses["200"].content === "undefined") {
      throw Error(`${objectName} =>  paths response content undefined `)
    }

    /**
     * @author Ryan
     * @description response 상태 값이 200 데이터만 처리한다.
     */
    if (typeof responses["200"].content !== "undefined") {
      let suffix

      const requestResponseType = Object.keys(responses["200"].content)
      const requestResponseContent =
        responses["200"].content[requestResponseType[0]].schema

      if (typeof requestResponseContent.properties !== "undefined") {
        _.forEach(
          requestResponseContent.properties,
          (propertiesValue, propertiesKey) => {
            //properties type 값이 object도 아니고 array도 아니라면 (string, number, boolean 타입)
            if (
              propertiesValue.type !== "object" &&
              propertiesValue.type !== "array"
            ) {
              const variableDescription = propertiesValue.description
              const type = propertiesValue.type
              const varibaleExample = propertiesValue.example

              if (typeof type === "undefined") {
                throw Error(
                  `${className} propertiesKey => ${propertiesKey} type undefined `
                )
              }

              const classValidatorType = classValidatorTypeSetting(type)
              classValidatorList.add(classValidatorType)

              const variableClassValidator = "@" + classValidatorType + "()"

              const variable = setCamelCase(propertiesKey) + " : " + type
              variableList.push({
                variableClassValidator,
                variable,
                variableDescription,
                varibaleExample,
              })
            } else if (propertiesValue.type === "object") {
              if (typeof propertiesValue.items !== "undefined") {
                throw Error(
                  `${objectName} => object type not items / object type to array type`
                )
              }
              const componentsObject = propertiesValue["$ref"].split("/")

              Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
                (element) => {
                  if (componentsObject[3] === element) {
                    //참조하는 클래스 schema 이름을 클래스 이름으로 설정한다.
                    const className = setPascalCase(element)

                    //변수 생성
                    const variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data"

                    //기본 값 설정
                    const varibaleExample = { className: className + "Data" }

                    //상세 설명
                    const variableDescription = propertiesValue.description

                    variableList.push({
                      variable,
                      variableDescription,
                      varibaleExample,
                    })

                    importRequestDto.add({
                      className: className + "Data",
                      from: _.kebabCase(className),
                    })
                  }
                }
              )
            } else if (propertiesValue.type === "array") {
              //items 속성은 open api 3.0 에서 배열로 나타낸다.
              //array type이라면 items로 정의는 필수!!
              if (typeof propertiesValue.items === "undefined") {
                throw Error(
                  `${objectName} => Schema object items properties undefined`
                )
              }

              const componentsObject = propertiesValue.items["$ref"].split("/")

              Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
                (element) => {
                  if (componentsObject[3] === element) {
                    //참조하는 클래스 schema 이름을 클래스 이름으로 설정한다.
                    const className = setPascalCase(element)

                    //변수 생성
                    const variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data[]"

                    //기본 값 설정
                    const varibaleExample = [className + "Data"]

                    //상세 설명
                    const variableDescription = propertiesValue.description

                    variableList.push({
                      variable,
                      variableDescription,
                      varibaleExample,
                    })

                    //import 정보를 참조하기 위해서 사용한다.
                    importRequestDto.add({
                      className: className + "Data",
                      from: _.kebabCase(className),
                    })
                  }
                }
              )
            }
          }
        )
      } //$ref를 바로 참조 하면서 참조하고 있는 Schema 속성 정보를 가져와서 속성에 정의한다.
      else if (
        typeof requestResponseContent.properties === "undefined" &&
        typeof requestResponseContent["$ref"] !== "undefined"
      ) {
        const componentsObject = requestResponseContent["$ref"].split("/")

        Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
          (element) => {
            if (componentsObject[3] === element) {
              _.forEach(
                jsonYaml.components[componentsObject[2]][element].properties,
                (propertiesValue, propertiesKey) => {
                  if (
                    typeof propertiesValue.items !== "undefined" &&
                    propertiesValue.type === "array"
                  ) {
                    // 클래스 변수명
                    const className = setPascalCase(componentsObject[3])

                    //변수 생성
                    const variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data[]"

                    //기본 값 설정
                    const varibaleExample = [className + "Data"]

                    //상세 설명
                    const variableDescription = propertiesValue.description

                    variableList.push({
                      variable,
                      variableDescription,
                      varibaleExample,
                    })

                    importRequestDto.add({
                      className: className + "Data",
                      from: _.kebabCase(className),
                    })
                  } else if (
                    typeof propertiesValue.items === "undefined" &&
                    propertiesValue.type === "object"
                  ) {
                    // 클래스 변수명
                    const className = setPascalCase(componentsObject[3])

                    //변수 생성
                    const variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data"

                    //기본 값 설정
                    const varibaleExample = { className: className + "Data" }

                    //상세설명
                    const variableDescription = propertiesValue.description

                    variableList.push({
                      variable,
                      variableDescription,
                      varibaleExample,
                    })

                    importRequestDto.add({
                      className: className + "Data",
                      from: _.kebabCase(className),
                    })
                  } else {
                    const type = propertiesValue.type

                    const classValidatorType = classValidatorTypeSetting(type)
                    classValidatorList.add(classValidatorType)

                    const variableClassValidator =
                      "@" + classValidatorType + "()"

                    //변수 생성
                    const variable = setCamelCase(propertiesKey) + " : " + type

                    //기본 값 설정
                    const varibaleExample = propertiesValue.example

                    //상세설명
                    const variableDescription = propertiesValue.description
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
    } else if (
      typeof responses["200"].content === "undefined" &&
      typeof responses["200"]["$ref"] !== "undefined"
    ) {
      const componentPath = responses["200"]["$ref"].split("/")

      let suffix

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

                  Object.keys(jsonYaml.components[componentsType[2]]).forEach(
                    (element) => {
                      if (componentsType[3] === element) {
                        const className = setPascalCase(element) // 클래스명

                        suffix =
                          componentsType[2] === "schemas" ? "Data" : "Dto"

                        const variable =
                          setCamelCase(key) + ":" + className + suffix + "[]"

                        varibaleExample = [className + suffix]

                        variableList.push({
                          variable,
                          variableDescription,
                          varibaleExample,
                        })

                        importRequestDto.add({
                          className: className + suffix,
                          from: `${_.kebabCase(className)}`,
                        })
                      }
                    }
                  )
                } else if (value.type === "object") {
                  const componentsType = value["$ref"].split("/")

                  Object.keys(jsonYaml.components[componentsType[2]]).forEach(
                    (element) => {
                      if (componentsType[3] === element) {
                        const className = setPascalCase(element) // 클래스명

                        suffix =
                          componentsType[2] === "schemas" ? "Data" : "Dto"

                        const variable =
                          setCamelCase(key) + ":" + className + suffix

                        varibaleExample = {
                          className: className + suffix,
                        }

                        variableList.push({
                          variable,
                          variableDescription,
                          varibaleExample,
                        })

                        importRequestDto.add({
                          className: className + suffix,
                          from: `${_.kebabCase(className)}`,
                        })
                      }
                    }
                  )
                } else if (typeof value.properties !== "undefined") {
                  throw Error(`${route} => value.properties not setting`)
                } else {
                  const classValidatorType = classValidatorTypeSetting(
                    value.type
                  )

                  classValidatorList.add(classValidatorType)

                  const variableClassValidator = "@" + classValidatorType + "()"
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
              _.forEach(componentInfo.content, (contentValue, contentKey) => {
                if (typeof componentInfo.content[contentKey] !== "undefined") {
                  _.forEach(componentInfo.content[contentKey], (value, key) => {
                    const variableDescription = value.description
                    let varibaleExample = value.example
                    if (typeof value.items !== "undefined") {
                      const componentsType = value.items["$ref"].split("/")

                      Object.keys(
                        jsonYaml.components[componentsType[2]]
                      ).forEach((element) => {
                        if (componentsType[3] === element) {
                          const className = setPascalCase(element) // 클래스명

                          suffix =
                            componentsType[2] === "schemas" ? "Data" : "Dto"

                          const variable =
                            setCamelCase(key) + ":" + className + suffix + "[]"

                          varibaleExample = [className + suffix]

                          variableList.push({
                            variable,
                            variableDescription,
                            varibaleExample,
                          })

                          importRequestDto.add({
                            className: className + suffix,
                            from: `${_.kebabCase(className)}`,
                          })
                        }
                      })
                    } else if (value.type === "object") {
                      if (typeof value.properties !== "undefined") {
                        _.forEach(value.properties, (value, key) => {
                          const variableDescription = value.description
                          let varibaleExample = value.example

                          if (
                            typeof value["$ref"] !== "undefined" ||
                            typeof value.items !== "undefined"
                          ) {
                            const componentsType =
                              typeof value.items !== "undefined"
                                ? value.items["$ref"].split("/")
                                : value["$ref"].split("/")

                            suffix =
                              componentsType[2] === "schemas" ? "Data" : "Dto"

                            const className = setPascalCase(componentsType[3])

                            const variableType =
                              value.type === "object"
                                ? className + suffix
                                : className + suffix + "[]"

                            varibaleExample =
                              value.type === "object"
                                ? {
                                    className: className + suffix,
                                  }
                                : [className + suffix]

                            const variable =
                              setCamelCase(key) + ":" + variableType

                            variableList.push({
                              variable,
                              variableDescription,
                              varibaleExample,
                            })

                            importRequestDto.add({
                              className: className + suffix,
                              from: `${_.kebabCase(className)}`,
                            })
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
                        const componentsType = value["$ref"].split("/")

                        Object.keys(
                          jsonYaml.components[componentsType[2]]
                        ).forEach((element) => {
                          if (componentsType[3] === element) {
                            const className = setPascalCase(element) // 클래스명

                            suffix =
                              componentsType[2] === "schemas" ? "Data" : "Dto"

                            const variable =
                              setCamelCase(key) + ":" + className + suffix
                            varibaleExample = {
                              className: className + suffix,
                            }

                            variableList.push({
                              variable,
                              variableDescription,
                              varibaleExample,
                            })

                            importRequestDto.add({
                              className: className + suffix,
                              from: `${_.kebabCase(className)}`,
                            })
                          }
                        })
                      }
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
                } else if (
                  typeof componentInfo.content[contentKey] !== "undefined"
                ) {
                  const componentPath =
                    componentInfo.content[contentKey]["$ref"].split("/")

                  _.forEach(
                    jsonYaml.components[componentPath[2]],
                    (componentInfo, componentkey) => {
                      if (componentPath[3] === componentkey) {
                        _.forEach(componentInfo.properties, (value, key) => {
                          const variableDescription = value.description
                          let varibaleExample = value.example

                          if (typeof value["$ref"] !== "undefined") {
                            const componentsType =
                              typeof value.items !== "undefined"
                                ? value.items["$ref"].split("/")
                                : value["$ref"].split("/")

                            suffix =
                              componentsType[2] === "schemas" ? "Data" : "Dto"

                            const className = setPascalCase(componentsType[3])

                            const variableType =
                              value.type === "object"
                                ? className + suffix
                                : className + suffix + "[]"

                            varibaleExample =
                              value.type === "object"
                                ? {
                                    className: className + suffix,
                                  }
                                : [className + suffix]

                            const variable =
                              setCamelCase(key) + ":" + variableType
                            variableList.push({
                              variable,
                              variableDescription,
                              varibaleExample,
                            })

                            importRequestDto.add({
                              className: className + suffix,
                              from: `${_.kebabCase(className)}`,
                            })
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
              })
            }
          }
        }
      )
    }

    temporaryData = { className: className + "Dto" }

    projectStructure.importRequestDto.add({
      className: className + "Dto",
      from: `../dto/${_.kebabCase(className)}.dto`,
    })

    dtoObjectList[className].variableList = variableList
    dtoObjectList[className].classValidatorList = classValidatorList
    dtoObjectList[className].importRequestDto = importRequestDto
  }

  return {
    projectStructureData: projectStructure,
    responsesObjectList: dtoObjectList,
    temporaryDatas: temporaryData,
  }
}

module.exports = {
  processingResponseData,
}

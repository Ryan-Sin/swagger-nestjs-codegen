const _ = require("lodash")

const {
  setPascalCase,
  setCamelCase,
  classValidatorTypeSetting,
  classDtoVariableTypeSetting,
  setKebabCase,
} = require("./function")

function processingResponseData(
  jsonYaml,
  responses,
  projectStructure,
  dtoObjectList,
  route
) {
  if (typeof responses["200"]["x-codegen-request-body-name"] !== "undefined") {
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

                const classValidatorType = classValidatorTypeSetting(value.type)

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
                        const componentsType =
                          typeof value.items !== "undefined"
                            ? value.items["$ref"].split("/")
                            : value["$ref"].split("/")

                        const suffix =
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

                        const variable = setCamelCase(key) + ":" + variableType

                        variableList.push({
                          variable,
                          variableDescription,
                          varibaleExample,
                        })

                        importRequestDto.add({
                          className: className,
                          from: `${setKebabCase(className)}`,
                        })
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
                  const componentsType = value.items["$ref"].split("/")

                  Object.keys(jsonYaml.components[componentsType[2]]).forEach(
                    (element) => {
                      if (
                        value.items["$ref"].split(
                          componentsType[2] + "/"
                        )[1] === element
                      ) {
                        const className = setPascalCase(element) // 클래스명

                        //여기 작업
                        const suffix =
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
                          className,
                          from: `${setKebabCase(className)}`,
                        })
                      }
                    }
                  )
                } else if (value.type === "object") {
                  const componentsType = value["$ref"].split("/")

                  Object.keys(jsonYaml.components[componentsType[2]]).forEach(
                    (element) => {
                      if (
                        value["$ref"].split(componentsType[2] + "/")[1] ===
                        element
                      ) {
                        const className = setPascalCase(element) // 클래스명

                        const suffix =
                          componentsType[2] === "schemas" ? "Data" : "Dto"

                        let variable =
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
                          className,
                          from: `${setKebabCase(className)}`,
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
                            ? setPascalCase(value.items["$ref"].split("/")[3])
                            : setPascalCase(value["$ref"].split("/")[3])

                        const suffix =
                          componentPath[2] === "schemas" ? "Data" : "Dto"

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

                        const variable = setCamelCase(key) + ":" + variableType

                        variableList.push({
                          variable,
                          variableDescription,
                          varibaleExample,
                        })

                        importRequestDto.add({
                          className,
                          from: `${setKebabCase(className)}`,
                        })
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
                }
              )
            }
          }
          //type을 설정하지 않았다면
          else if (typeof schema.type === "undefined") {
            if (typeof schema.properties !== "undefined") {
              _.forEach(schema.properties, (value, key) => {
                if (typeof value.type === "undefined") {
                  throw Error(`${route} => properties ${key} type undefined`)
                }

                const variableDescription = value.description
                let varibaleExample = value.example
                if (typeof value.items !== "undefined") {
                  const componentsType = value.items["$ref"].split("/")

                  Object.keys(jsonYaml.components[componentsType[2]]).forEach(
                    (element) => {
                      if (componentsType[3] === element) {
                        const className = setPascalCase(element) // 클래스명

                        const suffix =
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
                          className,
                          from: `${setKebabCase(className)}`,
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

                        const suffix =
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
                          from: `${setKebabCase(className)}`,
                        })
                      }
                    }
                  )
                } else if (typeof value.properties !== "undefined") {
                  throw Error(`${route} => value.properties not setting`)
                } else {
                  if (typeof value.type === "undefined") {
                    throw Error(`${route} => properties ${key} type undefined`)
                  }

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
            } else if (typeof schema["$ref"] !== "undefined") {
              const componentPath = schema["$ref"].split("/")

              _.forEach(
                jsonYaml.components[componentPath[2]],
                (componentInfo, componentkey) => {
                  if (componentPath[3] === componentkey) {
                    _.forEach(componentInfo.properties, (value, key) => {
                      if (typeof value.type === "undefined") {
                        throw Error(
                          `${route} => properties ${key} type undefined`
                        )
                      }

                      const variableDescription = value.description
                      let varibaleExample = value.example

                      if (typeof value["$ref"] !== "undefined") {
                        const className =
                          typeof value.items !== "undefined"
                            ? setPascalCase(value.items["$ref"].split("/")[3])
                            : setPascalCase(value["$ref"].split("/")[3])

                        const suffix =
                          componentPath[2] === "schemas" ? "Data" : "Dto"

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

                        const variable = setCamelCase(key) + ":" + variableType

                        variableList.push({
                          variable,
                          variableDescription,
                          varibaleExample,
                        })

                        importRequestDto.add({
                          className,
                          from: `${setKebabCase(className)}`,
                        })
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

              const variableClassValidator = "@" + classValidatorType + "()"
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

          projectStructure.importRequestDto.add({
            className,
            from: `${setKebabCase(className)}`,
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

                  Object.keys(jsonYaml.components[componentsType[2]]).forEach(
                    (element) => {
                      if (componentsType[3] === element) {
                        const className = setPascalCase(element) // 클래스명

                        const suffix =
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
                          className,
                          from: `${setKebabCase(className)}`,
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

                        const suffix =
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
                          className,
                          from: `${setKebabCase(className)}`,
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

                          const suffix =
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
                            className,
                            from: `${setKebabCase(className)}`,
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

                            const suffix =
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
                              className,
                              from: `${setKebabCase(className)}`,
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

                            const suffix =
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
                              className,
                              from: `${setKebabCase(className)}`,
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

                            const suffix =
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
                              className,
                              from: `${setKebabCase(className)}`,
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

      temporaryData = { className }

      projectStructure.importRequestDto.add({
        className,
        from: `${setKebabCase(className)}`,
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

  if (typeof responses["200"]["x-codegen-request-body-name"] === "undefined") {
    throw Error(`${route} => x-codegen-request-body-name Not defined `)
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

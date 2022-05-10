const _ = require("lodash")

const {
  setPascalCase,
  setCamelCase,
  classValidatorTypeSetting,
} = require("./function")

function processingRequestBodyData(
  jsonYaml,
  requestBody,
  projectStructure,
  dtoObjectList,
  requestDto,
  serviceParam,
  route
) {
  projectStructure.decorator_method.add("Body")

  if (typeof requestBody["x-codegen-request-body-name"] === "undefined") {
    throw new Error(
      `${route} paths requestBody x-codegen-request-body-name undefined`
    )
  }
  //component schemas에 선언하지 않고 독립적으로 선언했다면 x-codegen-request-body-name으로 클래스 이름을 선언한다.
  else if (typeof requestBody["x-codegen-request-body-name"] !== "undefined") {
    const className = setPascalCase(requestBody["x-codegen-request-body-name"])

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

    //content를 설정하지 않고 바로 ref로 컴포넌트를 참조한다면
    if (
      typeof requestBody["$ref"] !== "undefined" &&
      typeof requestBody.content === "undefined"
    ) {
      const componentsType = requestBody["$ref"].split("/")

      _.forEach(jsonYaml.components[componentsType[2]], (componentsValue) => {
        _.forEach(
          componentsValue.content["application/json"].schema.properties,
          (propertiesValue, propertiesKey) => {
            const variableDescription = propertiesValue.description

            //타입이 array 라면
            if (
              typeof propertiesValue.items !== "undefined" &&
              typeof propertiesValue.items["$ref"] !== "undefined"
            ) {
              const componentsObject = propertiesValue.items["$ref"].split("/")

              Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
                (element) => {
                  if (componentsObject[3] === element) {
                    // 클래스 변수명
                    let className = componentsObject[3]
                    className = setPascalCase(className)

                    variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data[]"

                    varibaleExample = [className + "Data"]

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
            }
            //타입이 object 라면
            else if (
              typeof propertiesValue.items === "undefined" &&
              typeof propertiesValue["$ref"] !== "undefined"
            ) {
              const componentsObject = propertiesValue["$ref"].split("/")

              Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
                (element) => {
                  if (componentsObject[3] === element) {
                    // 클래스 변수명
                    let className = componentsObject[3]
                    className = setPascalCase(className)

                    variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data"

                    varibaleExample = { className: className + "Data" }

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
            }
            //일반 값이라면
            else {
              const description = propertiesValue.description
              const type = propertiesValue.type
              const example = propertiesValue.example

              const classValidatorType = classValidatorTypeSetting(type)
              classValidatorList.add(classValidatorType)

              const variableClassValidator = "@" + classValidatorType + "()"

              const variable =
                setCamelCase(propertiesKey) + " : " + setPascalCase(type)
              variableList.push({
                variableClassValidator,
                variable,
                variableDescription: description,
                varibaleExample: example,
              })
            }
          }
        )
      })
    }
    //content를 참조한다면
    else if (typeof requestBody.content !== "undefined") {
      const requestBodyContent = requestBody.content["application/json"].schema

      //properties 정보가 있다면
      if (typeof requestBodyContent.properties !== "undefined") {
        _.forEach(
          requestBodyContent.properties,
          (propertiesValue, propertiesKey) => {
            const variableDescription = propertiesValue.description

            if (
              typeof propertiesValue.items !== "undefined" &&
              propertiesValue.type === "array"
            ) {
              const componentsObject = propertiesValue.items["$ref"].split("/")

              Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
                (element) => {
                  if (componentsObject[3] === element) {
                    // 클래스 변수명
                    let className = componentsObject[3]
                    className = setPascalCase(className)

                    variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data[]"

                    varibaleExample = [className + "Data"]

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
            } else if (
              typeof propertiesValue.items === "undefined" &&
              propertiesValue.type === "object"
            ) {
              const componentsObject = propertiesValue["$ref"].split("/")

              Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
                (element) => {
                  if (componentsObject[3] === element) {
                    // 클래스 변수명
                    let className = componentsObject[3]
                    className = setPascalCase(className)

                    variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data"

                    varibaleExample = { className: className + "Data" }

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
            } else {
              const description = propertiesValue.description
              const type = propertiesValue.type
              const example = propertiesValue.example

              const classValidatorType = classValidatorTypeSetting(type)
              classValidatorList.add(classValidatorType)

              const variableClassValidator = "@" + classValidatorType + "()"

              const variable =
                setCamelCase(propertiesKey) + " : " + setPascalCase(type)
              variableList.push({
                variableClassValidator,
                variable,
                variableDescription: description,
                varibaleExample: example,
              })
            }
          }
        )
      }
      //$ref를 바로 참조 하면서 type object라면
      else if (
        typeof requestBodyContent.properties === "undefined" &&
        typeof requestBodyContent["$ref"] !== "undefined"
      ) {
        const componentsObject = requestBodyContent["$ref"].split("/")

        Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
          (element) => {
            if (componentsObject[3] === element) {
              _.forEach(
                jsonYaml.components[componentsObject[2]][element].properties,
                (propertiesValue, propertiesKey) => {
                  const variableDescription = propertiesValue.description

                  if (
                    typeof propertiesValue.items !== "undefined" &&
                    propertiesValue.type === "array"
                  ) {
                    // 클래스 변수명
                    let className = componentsObject[3]
                    className = setPascalCase(className)

                    variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data[]"

                    varibaleExample = [className + "Data"]

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
                    typeof propertiesValue.type === "object"
                  ) {
                    // 클래스 변수명
                    let className = componentsObject[3]
                    className = setPascalCase(className)

                    variable =
                      setCamelCase(propertiesKey) + " : " + className + "Data"

                    varibaleExample = { className: className + "Data" }

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
                    const description = propertiesValue.description
                    const type = propertiesValue.type
                    const example = propertiesValue.example

                    const classValidatorType = classValidatorTypeSetting(type)
                    classValidatorList.add(classValidatorType)

                    const variableClassValidator =
                      "@" + classValidatorType + "()"

                    const variable =
                      setCamelCase(propertiesKey) + " : " + setPascalCase(type)
                    variableList.push({
                      variableClassValidator,
                      variable,
                      variableDescription: description,
                      varibaleExample: example,
                    })
                  }
                }
              )
            }
          }
        )
      }
      //$ref를 바로 참조 하면서 type array 라면 Error 정책상 key가 필요하다
      else if (
        typeof requestBodyContent.properties === "undefined" &&
        typeof requestBodyContent.items["$ref"] !== "undefined"
      ) {
        throw Error(`${className} => ${route}} schema properties undefined `)
      }
    }

    dtoObjectList[className].variableList = variableList
    dtoObjectList[className].classValidatorList = classValidatorList
    dtoObjectList[className].importRequestDto = importRequestDto
  }

  return {
    projectStructureData: projectStructure,
    requestObjectList: dtoObjectList,
    serviceParamData: serviceParam,
    requestDtoData: requestDto,
  }
}

module.exports = {
  processingRequestBodyData,
}

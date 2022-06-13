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

    const classVariableName = setCamelCase(className)

    //schemas 클래스 이름 설정
    dtoObjectList[className] = {
      className,
      classDescription: requestBody.description ? requestBody.description : "",
    }

    //DTO class-validator에 사용됨
    const classValidatorList = new Set()

    //DTO 클레스 변수명과 타입을 담는
    const variableList = []

    //import DTO 클래스
    const importRequestDto = new Set()

    if (typeof requestBody.content === "undefined") {
      throw Error(`${objectName} =>  paths requestBody content undefined `)
    }

    //content를 참조한다면
    if (typeof requestBody.content !== "undefined") {
      const requestBodyType = Object.keys(requestBody.content)
      const requestBodyContent = requestBody.content[requestBodyType[0]].schema

      //properties 정보가 있다면
      if (typeof requestBodyContent.properties !== "undefined") {
        _.forEach(
          requestBodyContent.properties,
          (propertiesValue, propertiesKey) => {
            /**
             * variableDescription: 상세 설명
             * type : 타입
             * varibaleExample : 예시 데이터
             */
            const variableDescription = propertiesValue.description
            const variableType = propertiesValue.type
            const varibaleExample = propertiesValue.example

            const variableClassValidator = new Set()

            let optional = "?"

            if (typeof requestBodyContent.required !== "undefined") {
              const existence =
                requestBodyContent.required.includes(propertiesKey)

              if (existence) {
                optional = existence ? "" : "?"
              } else {
                classValidatorList.add("IsOptional")
                variableClassValidator.add("@IsOptional()")
              }
            } else {
              classValidatorList.add("IsOptional")
              variableClassValidator.add("@IsOptional()")
            }

            //properties type 값이 object도 아니고 array도 아니라면 (string, number, boolean 타입)
            if (
              propertiesValue.type !== "object" &&
              propertiesValue.type !== "array"
            ) {
              if (typeof variableType === "undefined") {
                throw Error(
                  `${className} propertiesKey => ${propertiesKey} type undefined `
                )
              }
              //class-validator 타입 설정
              const classValidatorType = classValidatorTypeSetting(variableType)

              //class-validator 타입 추가
              classValidatorList.add(classValidatorType)

              //테코레이터 생성
              variableClassValidator.add("@" + classValidatorType + "()")

              const variable =
                setCamelCase(propertiesKey) + optional + " : " + variableType

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

              if (typeof propertiesValue["$ref"] !== "undefined") {
                const componentsObject = propertiesValue["$ref"].split("/")

                Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
                  (element) => {
                    if (componentsObject[3] === element) {
                      //참조하는 클래스 schema 이름을 클래스 이름으로 설정한다.
                      const className = setPascalCase(element)

                      //class-validator 타입 설정
                      const classValidatorType =
                        classValidatorTypeSetting(variableType)

                      //class-validator 타입 추가
                      classValidatorList.add(classValidatorType)

                      //테코레이터 생성
                      variableClassValidator.add(
                        "@" + classValidatorType + "()"
                      )

                      //변수 생성
                      const variable =
                        setCamelCase(propertiesKey) +
                        optional +
                        " : " +
                        className +
                        "Data"

                      //기본 값 설정
                      const varibaleExample = { className: className + "Data" }

                      variableList.push({
                        variableClassValidator,
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
                //class-validator 타입 설정
                const classValidatorType =
                  classValidatorTypeSetting(variableType)

                //class-validator 타입 추가
                classValidatorList.add(classValidatorType)

                //테코레이터 생성
                variableClassValidator.add("@" + classValidatorType + "()")

                //변수 생성
                const variable =
                  setCamelCase(propertiesKey) + optional + " : object"

                variableList.push({
                  variableClassValidator,
                  variable,
                  variableDescription,
                  varibaleExample,
                })
              }
            } else if (propertiesValue.type === "array") {
              //items 속성은 open api 3.0 에서 배열로 나타낸다.
              //array type이라면 items로 정의는 필수!!
              if (typeof propertiesValue.items === "undefined") {
                throw Error(
                  `${objectName} => Schema object items properties undefined`
                )
              }

              if (typeof propertiesValue["$ref"] !== "undefined") {
                const componentsObject =
                  propertiesValue.items["$ref"].split("/")

                Object.keys(jsonYaml.components[componentsObject[2]]).forEach(
                  (element) => {
                    if (componentsObject[3] === element) {
                      //참조하는 클래스 schema 이름을 클래스 이름으로 설정한다.
                      const className = setPascalCase(element)

                      //class-validator 타입 설정
                      const classValidatorType =
                        classValidatorTypeSetting(variableType)

                      //class-validator 타입 추가
                      classValidatorList.add(classValidatorType)

                      //테코레이터 생성
                      variableClassValidator.add(
                        "@" + classValidatorType + "()"
                      )

                      //변수 생성
                      const variable =
                        setCamelCase(propertiesKey) +
                        optional +
                        " : " +
                        className +
                        "Data[]"

                      //기본 값 설정
                      const varibaleExample = [className + "Data"]

                      variableList.push({
                        variableClassValidator,
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
              } else {
                // const varibaleExample = propertiesValue.items.example
                //   ? JSON.stringify(propertiesValue.items.example)
                //   : "[]"

                //class-validator 타입 설정
                const classValidatorType =
                  classValidatorTypeSetting(variableType)

                //class-validator 타입 추가
                classValidatorList.add(classValidatorType)

                //테코레이터 생성
                variableClassValidator.add("@" + classValidatorType + "()")

                //변수 생성
                const variable =
                  setCamelCase(propertiesKey) + optional + " : Array<any>"

                variableList.push({
                  variableClassValidator,
                  variable,
                  variableDescription,
                  // varibaleExample,
                })
              }
            }
          }
        )
      }
      //$ref를 바로 참조 하면서 참조하고 있는 Schema 속성 정보를 가져와서 속성에 정의한다.
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
                  /**
                   * variableDescription: 상세 설명
                   * type : 타입
                   * varibaleExample : 예시 데이터
                   */
                  const variableDescription = propertiesValue.description
                  const variableType = propertiesValue.type
                  const varibaleExample = propertiesValue.example

                  const variableClassValidator = new Set()

                  let optional = "?"

                  if (typeof requestBodyContent.required !== "undefined") {
                    const existence =
                      requestBodyContent.required.includes(propertiesKey)

                    if (existence) {
                      optional = existence ? "" : "?"
                    } else {
                      classValidatorList.add("IsOptional")
                      variableClassValidator.add("@IsOptional()")
                    }
                  } else {
                    classValidatorList.add("IsOptional")
                    variableClassValidator.add("@IsOptional()")
                  }

                  if (
                    typeof propertiesValue.items !== "undefined" &&
                    propertiesValue.type === "array"
                  ) {
                    // 클래스 변수명
                    const className = setPascalCase(componentsObject[3])

                    //class-validator 타입 설정
                    const classValidatorType =
                      classValidatorTypeSetting(variableType)

                    //class-validator 타입 추가
                    classValidatorList.add(classValidatorType)

                    //테코레이터 생성
                    variableClassValidator.add("@" + classValidatorType + "()")

                    //변수 생성
                    const variable =
                      setCamelCase(propertiesKey) +
                      optional +
                      " : " +
                      className +
                      "Data[]"

                    //기본 값 설정
                    const varibaleExample = [className + "Data"]

                    variableList.push({
                      variableClassValidator,
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

                    //class-validator 타입 설정
                    const classValidatorType =
                      classValidatorTypeSetting(variableType)

                    //class-validator 타입 추가
                    classValidatorList.add(classValidatorType)

                    //테코레이터 생성
                    variableClassValidator.add("@" + classValidatorType + "()")

                    //변수 생성
                    const variable =
                      setCamelCase(propertiesKey) +
                      optional +
                      " : " +
                      className +
                      "Data"

                    //기본 값 설정
                    const varibaleExample = { className: className + "Data" }

                    variableList.push({
                      variableClassValidator,
                      variable,
                      variableDescription,
                      varibaleExample,
                    })

                    importRequestDto.add({
                      className: className + "Data",
                      from: _.kebabCase(className),
                    })
                  } else {
                    //class-validator 타입 설정
                    const classValidatorType = classValidatorTypeSetting(type)

                    //class-validator 타입 추가
                    classValidatorList.add(classValidatorType)

                    //테코레이터 생성
                    variableClassValidator.add("@" + classValidatorType + "()")

                    //변수 생성
                    const variable =
                      setCamelCase(propertiesKey) + optional + " : " + type

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
      //$ref를 바로 참조 하면서 type array 라면 Error 정책상 key가 필요하다
      else if (
        typeof requestBodyContent.properties === "undefined" &&
        typeof requestBodyContent.items["$ref"] !== "undefined"
      ) {
        throw Error(`${className} => ${route}} schema properties undefined `)
      }
    }

    requestDto.add({
      classVariableName: classVariableName + "Dto",
      className: className + "Dto",
    })

    serviceParam.push(classVariableName + "Dto")

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
    requestObjectList: dtoObjectList,
    serviceParamData: serviceParam,
    requestDtoData: requestDto,
  }
}

module.exports = {
  processingRequestBodyData,
}

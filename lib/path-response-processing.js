const _ = require("lodash")

const {
  setPascalCase,
  setCamelCase,
  classValidatorTypeSetting,
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
      classDescription: responses.description ? responses.description : "",
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
      const requestResponseType = Object.keys(responses["200"].content)
      const requestResponseContent =
        responses["200"].content[requestResponseType[0]].schema

      if (typeof requestResponseContent.properties !== "undefined") {
        _.forEach(
          requestResponseContent.properties,
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

            if (typeof requestResponseContent.required !== "undefined") {
              const existence =
                requestResponseContent.required.includes(propertiesKey)

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

                  if (typeof requestResponseContent.required !== "undefined") {
                    const existence =
                      requestResponseContent.required.includes(propertiesKey)

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
                      variableType

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

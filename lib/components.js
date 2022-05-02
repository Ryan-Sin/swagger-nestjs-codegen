const _ = require("lodash")
const {
  setPascalCase,
  setCamelCase,
  classValidatorTypeSetting,
  classDtoVariableTypeSetting,
} = require("./function")
/**
 * @author Ryan
 * @description components -> schemas 구성요소 생성
 *
 * @param {Object} schemas
 */
function createSchemas(schemas) {
  const dataObjectList = []

  _.forEach(schemas, (object, objectName) => {
    const className = setPascalCase(objectName)

    //schemas 클래스 이름 설정
    dataObjectList[className] = {
      className,
    }

    //DTO class-validator에 사용됨
    const classValidatorList = new Set()

    //DTO 클레스 변수명과 타입을 담는
    const variableList = []

    //import DTO 클래스
    const importRequestDto = new Set()

    //schemas 객체 속성이 없다면
    if (typeof object.properties === "undefined") {
      throw Error(`${objectName} => Schemas object not properties undefined `)
    }

    //Object 속성 조회
    _.forEach(object.properties, (value, key) => {
      //schemas description 정보가 있다면 주석을 추가한다.
      if (typeof object.description !== "undefined") {
      }

      //schemas 객체 속성 값에 Type이 없다면 Error
      if (typeof value.type === "undefined") {
        throw Error(
          `${objectName} => Schemas object properties type in undefined`
        )
      }

      /**
       * @description schemas.object.type(object.type) 값이 object, array, undefined 상태에 따른 값 처리
       */
      const variableDescription = value.description
      const varibaleExample = value.example

      //properties type 값이 object도 아니고 array도 아니라면 (string, number, boolean 타입)
      if (value.type !== "object" && value.type !== "array") {
        const classValidatorType = classValidatorTypeSetting(value.type)
        classValidatorList.add(classValidatorType)

        const variableClassValidator = "@" + classValidatorType + "()"
        const variable =
          setCamelCase(key) + ":" + classDtoVariableTypeSetting(value.type)

        variableList.push({
          variableClassValidator,
          variable,
          variableDescription,
          varibaleExample,
        })
      } else if (value.type === "object") {
        //items 속성은 open api 3.0 에서 배열로 나타낸다.
        //실제는 Error를 설정해야 하지만... 실수로 작성할 수 있기 때문에 작성한다.
        if (typeof value.items !== "undefined") {
          //schemas 객체 속성 값에 properties로 다른... 객체 속성을 정의한다면 Error... 클래스를 만들 수 있는 방법이 없다.
          if (typeof value.properties !== "undefined") {
            throw Error(
              `${objectName} => Schema object cannot define properties`
            )
          }

          if (typeof value.items["$ref"] === "undefined") {
            throw Error(
              `${objectName} => Schemas object properties items $ref in undefined`
            )
          }

          Object.keys(schemas).forEach((element) => {
            //items 속성이 $ref 방식이라면
            if (typeof value.items["$ref"] !== "undefined") {
              if (value.items["$ref"].split("schemas/")[1] === element) {
                const className = setPascalCase(element)

                const variable = setCamelCase(key) + " : " + className + "[]"
                variableList.push({
                  variable,
                  variableDescription,
                  varibaleExample,
                })
                importRequestDto.add(className)
              }
            }
          })
        }
        //object type check
        else if (value.type === "object") {
          Object.keys(schemas).forEach((element) => {
            //items 속성이 $ref 방식이라면
            if (typeof value["$ref"] !== "undefined") {
              if (value["$ref"].split("schemas/")[1] === element) {
                const className = setPascalCase(element)

                const variable = setCamelCase(key) + " : " + className
                variableList.push({
                  variable,
                  variableDescription,
                  varibaleExample,
                })
                importRequestDto.add(className)
              }
            }
          })
        }
        //기본적인 type 설정
        else {
          const className = setPascalCase(key)
          const variable = setCamelCase(key) + " : " + className

          variableList.push({
            variable,
            variableDescription,
            varibaleExample,
          })
          importRequestDto.add(className)
        }
      } else if (value.type === "array") {
        //items 속성은 open api 3.0 에서 배열로 나타낸다.
        //array type이라면 items로 정의는 필수!!
        if (typeof value.items === "undefined") {
          throw Error(
            `${objectName} => Schema object items properties undefined`
          )
        }

        if (typeof value.items !== "undefined") {
          Object.keys(schemas).forEach((element) => {
            if (value.items["$ref"].split("schemas/")[1] === element) {
              const className = setPascalCase(element)

              const variable = setCamelCase(key) + " : " + className + "[]"
              variableList.push({
                variable,
                variableDescription,
              })
              importRequestDto.add(className)
            }
          })
        } else {
          const className = setPascalCase(key)

          const variable = setCamelCase(key) + " : " + className + "[]"
          variableList.push({
            variable,
            variableDescription,
            varibaleExample,
          })
        }
      }
    })

    dataObjectList[className].variableList = variableList
    dataObjectList[className].classValidatorList = classValidatorList
    dataObjectList[className].importRequestDto = importRequestDto
  })

  return dataObjectList
}

/**
 * @author Ryan
 * @description components -> requestBodies 구성요소 생성
 *
 * @param {Object} requestBodies components.requestBodies  정보
 * @param {Object} schemas components.schemas  정보
 * @param {Array} dataObjectList 데이터를 등록하는 배열
 */
function createRequestBodies(requestBodies, schemas, dtoObjectList) {
  _.forEach(requestBodies, (object, objectName) => {
    const className = setPascalCase(objectName)

    //requestBodies 클래스 이름 설정
    dtoObjectList[className] = {
      className,
    }

    //DTO class-validator에 사용됨
    const classValidatorList = new Set()

    //DTO 클레스 변수명과 타입을 담는
    const variableList = []

    //import DTO 클래스
    const importRequestDto = new Set()

    //requestBodies 객체 속성이 없다면
    if (typeof object.content === "undefined") {
      throw Error(
        `${objectName} => requestBodies object not content undefined `
      )
    }

    _.forEach(object.content, (typeValue, mediaType) => {
      //Object 속성 조회
      _.forEach(object.content[mediaType], (mediaTypeValue, mediaTypeKey) => {
        //requestBodies 객체 속성 값에 Type이 없다면 Error
        if (typeof mediaTypeValue.type === "undefined") {
          throw Error(
            `${objectName} => requestBodies object properties type in undefined`
          )
        }

        /**
         * @description requestBodies.object.type(object.type) 값이 object, array, undefined 상태에 따른 값 처리
         */
        const variableDescription = mediaTypeValue.description
        const varibaleExample = mediaTypeValue.example

        //properties type 값이 object도 아니고 array도 아니라면 (string, number, boolean 타입)
        if (
          mediaTypeValue.type !== "object" &&
          mediaTypeValue.type !== "array"
        ) {
          const classValidatorType = classValidatorTypeSetting(
            mediaTypeValue.type
          )
          classValidatorList.add(classValidatorType)

          const variableClassValidator = "@" + classValidatorType + "()"
          const variable =
            setCamelCase(mediaTypeValue.type) +
            ":" +
            classDtoVariableTypeSetting(mediaTypeValue.type)

          variableList.push({
            variableClassValidator,
            variable,
            variableDescription,
            varibaleExample,
          })
        } else if (mediaTypeValue.type === "object") {
          //items 속성은 open api 3.0 에서 배열로 나타낸다.
          //실제는 Error를 설정해야 하지만... 실수로 작성할 수 있기 때문에 작성한다.
          if (typeof mediaTypeValue.items !== "undefined") {
            //requestBodies 객체 속성 값에 properties로 다른... 객체 속성을 정의한다면 Error... 클래스를 만들 수 있는 방법이 없다.
            if (typeof mediaTypeValue.properties !== "undefined") {
              throw Error(
                `${objectName} => Schema object cannot define properties`
              )
            }

            if (typeof mediaTypeValue.items["$ref"] === "undefined") {
              throw Error(
                `${objectName} => requestBodies object properties items $ref in undefined`
              )
            }

            Object.keys(schemas).forEach((element) => {
              //items 속성이 $ref 방식이라면
              if (typeof mediaTypeValue.items["$ref"] !== "undefined") {
                if (
                  mediaTypeValue.items["$ref"].split("schemas/")[1] === element
                ) {
                  const className = setPascalCase(element)

                  const variable =
                    setCamelCase(mediaTypeKey) + " : " + className + "[]"
                  variableList.push({
                    variable,
                    variableDescription,
                    varibaleExample,
                  })
                  importRequestDto.add(className)
                }
              }
            })
          }
          //object type check
          else if (mediaTypeValue.type === "object") {
            //items 속성이 $ref 방식이라면
            if (typeof mediaTypeValue["$ref"] !== "undefined") {
              Object.keys(schemas).forEach((element) => {
                if (mediaTypeValue["$ref"].split("schemas/")[1] === element) {
                  const className = setPascalCase(element)

                  const variable = setCamelCase(element) + " : " + className
                  variableList.push({
                    variable,
                    variableDescription,
                    varibaleExample,
                  })
                  importRequestDto.add(className)
                }
              })
            } else if (typeof mediaTypeValue.properties !== "undefined") {
              for (const key in mediaTypeValue.properties) {
                if (
                  Object.hasOwnProperty.call(mediaTypeValue.properties, key)
                ) {
                  const obj = mediaTypeValue.properties[key]

                  const classValidatorType = classValidatorTypeSetting(obj.type)
                  classValidatorList.add(classValidatorType)

                  const variableClassValidator = "@" + classValidatorType + "()"

                  const type = setPascalCase(obj.type)

                  const variable = setCamelCase(key) + " : " + type
                  variableList.push({
                    variableClassValidator,
                    variable,
                    variableDescription,
                    varibaleExample,
                  })
                }
              }
            }
          }
        } else if (mediaTypeValue.type === "array") {
          //items 속성은 open api 3.0 에서 배열로 나타낸다.
          //array type이라면 items로 정의는 필수!!
          if (typeof mediaTypeValue.items === "undefined") {
            throw Error(
              `${objectName} => Schema object items properties undefined`
            )
          }

          if (typeof mediaTypeValue.items !== "undefined") {
            Object.keys(schemas).forEach((element) => {
              if (
                mediaTypeValue.items["$ref"].split("schemas/")[1] === element
              ) {
                const className = setPascalCase(element)

                const variable =
                  setCamelCase(element) + " : " + className + "[]"
                variableList.push({
                  variable,
                  variableDescription,
                })
                importRequestDto.add(className)
              }
            })
          }
        }
      })
    })

    dtoObjectList[className].variableList = variableList
    dtoObjectList[className].classValidatorList = classValidatorList
    dtoObjectList[className].importRequestDto = importRequestDto
  })

  return dtoObjectList
}

/**
 * @author Ryan
 * @description components -> responses 구성요소 생성
 *
 * @param {Object} responses components.responses  정보
 * @param {Object} schemas components.schemas  정보
 * @param {Array} dtoObjectList 데이터를 등록하는 배열
 */
function createResponse(responses, schemas, dtoObjectList) {
  _.forEach(responses, (object, objectName) => {
    const className = setPascalCase(objectName)

    //responses 클래스 이름 설정
    dtoObjectList[className] = {
      className,
    }

    //DTO class-validator에 사용됨
    const classValidatorList = new Set()

    //DTO 클레스 변수명과 타입을 담는
    const variableList = []

    //import DTO 클래스
    const importRequestDto = new Set()

    //responses 객체 속성이 없다면
    if (typeof object.content === "undefined") {
      throw Error(`${objectName} => responses object not content undefined `)
    }

    _.forEach(object.content, (typeValue, mediaType) => {
      //Object 속성 조회
      _.forEach(object.content[mediaType], (mediaTypeValue, mediaTypeKey) => {
        //responses 객체 속성 값에 Type이 없다면 Error
        if (typeof mediaTypeValue.type === "undefined") {
          throw Error(
            `${objectName} => responses object properties type in undefined`
          )
        }

        /**
         * @description responses.object.type(object.type) 값이 object, array, undefined 상태에 따른 값 처리
         */
        const variableDescription = mediaTypeValue.description
        const varibaleExample = mediaTypeValue.example

        //properties type 값이 object도 아니고 array도 아니라면 (string, number, boolean 타입)
        if (
          mediaTypeValue.type !== "object" &&
          mediaTypeValue.type !== "array"
        ) {
          const classValidatorType = classValidatorTypeSetting(
            mediaTypeValue.type
          )
          classValidatorList.add(classValidatorType)

          const variableClassValidator = "@" + classValidatorType + "()"
          const variable =
            setCamelCase(mediaTypeValue.type) +
            ":" +
            classDtoVariableTypeSetting(mediaTypeValue.type)

          variableList.push({
            variableClassValidator,
            variable,
            variableDescription,
            varibaleExample,
          })
        } else if (mediaTypeValue.type === "object") {
          //items 속성은 open api 3.0 에서 배열로 나타낸다.
          //실제는 Error를 설정해야 하지만... 실수로 작성할 수 있기 때문에 작성한다.
          if (typeof mediaTypeValue.items !== "undefined") {
            //responses 객체 속성 값에 properties로 다른... 객체 속성을 정의한다면 Error... 클래스를 만들 수 있는 방법이 없다.
            if (typeof mediaTypeValue.properties !== "undefined") {
              throw Error(
                `${objectName} => Schema object cannot define properties`
              )
            }

            if (typeof mediaTypeValue.items["$ref"] === "undefined") {
              throw Error(
                `${objectName} => responses object properties items $ref in undefined`
              )
            }

            Object.keys(schemas).forEach((element) => {
              //items 속성이 $ref 방식이라면
              if (typeof mediaTypeValue.items["$ref"] !== "undefined") {
                if (
                  mediaTypeValue.items["$ref"].split("schemas/")[1] === element
                ) {
                  const className = setPascalCase(element)

                  const variable =
                    setCamelCase(mediaTypeKey) + " : " + className + "[]"
                  variableList.push({
                    variable,
                    variableDescription,
                    varibaleExample,
                  })
                  importRequestDto.add(className)
                }
              }
            })
          }
          //object type check
          else if (mediaTypeValue.type === "object") {
            //items 속성이 $ref 방식이라면
            if (typeof mediaTypeValue["$ref"] !== "undefined") {
              Object.keys(schemas).forEach((element) => {
                if (mediaTypeValue["$ref"].split("/")[3] === element) {
                  const className = setPascalCase(element)

                  const variable = setCamelCase(element) + " : " + className
                  variableList.push({
                    variable,
                    variableDescription,
                    varibaleExample,
                  })
                  importRequestDto.add(className)
                }
              })
            } else if (typeof mediaTypeValue.properties !== "undefined") {
              for (const key in mediaTypeValue.properties) {
                if (
                  Object.hasOwnProperty.call(mediaTypeValue.properties, key)
                ) {
                  const obj = mediaTypeValue.properties[key]

                  const classValidatorType = classValidatorTypeSetting(obj.type)
                  classValidatorList.add(classValidatorType)

                  const variableClassValidator = "@" + classValidatorType + "()"

                  const type = setPascalCase(obj.type)

                  const variable = setCamelCase(key) + " : " + type
                  variableList.push({
                    variableClassValidator,
                    variable,
                    variableDescription,
                    varibaleExample,
                  })
                }
              }
            }
          }
        } else if (mediaTypeValue.type === "array") {
          //items 속성은 open api 3.0 에서 배열로 나타낸다.
          //array type이라면 items로 정의는 필수!!
          if (typeof mediaTypeValue.items === "undefined") {
            throw Error(
              `${objectName} => Schema object items properties undefined`
            )
          }

          if (typeof mediaTypeValue.items !== "undefined") {
            if (typeof mediaTypeValue.items["$ref"] !== "undefined") {
              Object.keys(schemas).forEach((element) => {
                if (
                  mediaTypeValue.items["$ref"].split("schemas/")[1] === element
                ) {
                  const className = setPascalCase(element)

                  const variable =
                    setCamelCase(element) + " : " + className + "[]"
                  variableList.push({
                    variable,
                    variableDescription,
                  })
                  importRequestDto.add(className)
                }
              })
            }
          }
        }
      })
    })

    dtoObjectList[className].variableList = variableList
    dtoObjectList[className].classValidatorList = classValidatorList
    dtoObjectList[className].importRequestDto = importRequestDto
  })

  return dtoObjectList
}

module.exports = {
  createSchemas,
  createRequestBodies,
  createResponse,
}

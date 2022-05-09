const _ = require("lodash")

const {
  setPascalCase,
  setCamelCase,
  classValidatorTypeSetting,
  setKebabCase,
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
  projectStructure.decorator_method.add("UsePipes")
  projectStructure.decorator_method.add("ValidationPipe")

  //component schemas에 선언하지 않고 독립적으로 선언했다면 x-codegen-request-body-name으로 클래스 이름을 선언한다.
  if (typeof requestBody["x-codegen-request-body-name"] !== "undefined") {
    if (typeof requestBody.content === "undefined") {
      throw new Error(
        `${domainName} => ${route} paths requestBody content undefined`
      )
    }

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

    const object = requestBody.content["application/json"].schema.properties

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

    projectStructure.importRequestDto.add({
      className,
      from: `../dto/${setKebabCase(className)}`,
    })
  }
  //$ref를 참조 한다면
  else if (typeof requestBody["$ref"] !== "undefined") {
    const componentsType = requestBody["$ref"].split("/")[2]

    Object.keys(jsonYaml.components[componentsType]).forEach((element) => {
      if (requestBody["$ref"].split(`${componentsType}/`)[1] === element) {
        // 클래스 변수명
        const className = requestBody["$ref"].split(`${componentsType}/`)[1]

        const componentPath =
          componentsType === "schemas"
            ? `../dto/data/${setKebabCase(className)}`
            : "requestBodies"
            ? `../dto/${setKebabCase(className)}`
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

        projectStructure.importRequestDto.add({
          className,
          from: componentPath,
        })
      }
    })
  }
  // 그렇지 않다면
  else if (typeof requestBody.content["application/json"] !== "undefined") {
    const componentsType =
      requestBody.content["application/json"].schema["$ref"].split("/")[2]

    Object.keys(jsonYaml.components[componentsType]).forEach((element) => {
      if (
        requestBody.content["application/json"].schema["$ref"].split(
          `${componentsType}/`
        )[1] === element
      ) {
        // 클래스 변수명
        const className = requestBody.content["application/json"].schema[
          "$ref"
        ].split(`${componentsType}/`)[1]

        const componentPath =
          componentsType === "schemas"
            ? `../dto/data/${setKebabCase(className)}`
            : "requestBodies"
            ? `../dto/${setKebabCase(className)}`
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

        projectStructure.importRequestDto.add({
          className,
          from: componentPath,
        })
      }
    })
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

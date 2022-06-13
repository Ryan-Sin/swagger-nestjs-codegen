const _ = require("lodash")

/**
 * @author Ryan
 * @descriptin 변수명에 하이픈(-), 언더바(-) 정보를 제외하고 파스칼 케이스 변수명을 변경
 *
 * @param {String} data 변수명
 * @returns {String}
 */
function setPascalCase(data) {
  if (data.includes("-") || data.includes("_")) {
    const dataInfo = data.includes("-")
      ? data.split("-")
      : data.includes("_")
      ? data.split("_")
      : null

    if (dataInfo == null) {
      return _.startCase(_.camelCase(data)).replace(/ /g, "")
    }

    let variable = ""

    for (let index = 0; index < dataInfo.length; index++) {
      const variableName = dataInfo[index]
      variable +=
        index === 0
          ? variableName
          : _.startCase(_.camelCase(variableName)).replace(/ /g, "")
    }

    return variable
  }

  return _.startCase(_.camelCase(data)).replace(/ /g, "")
}

/**
 * @author Ryan
 * @descriptin 변수명에 하이픈(-), 언더바(-) 정보를 제외하고 카멜 케이스 변수명을 변경
 *
 * @param {String} data 변수명
 * @returns {String}
 */
function setCamelCase(data) {
  if (data.includes("-") || data.includes("_")) {
    const dataInfo = data.includes("-")
      ? data.split("-")
      : data.includes("_")
      ? data.split("_")
      : null

    if (dataInfo == null) {
      return _.camelCase(data).replace(/ /g, "")
    }

    let variable = ""

    for (let index = 0; index < dataInfo.length; index++) {
      const variableName = dataInfo[index]

      variable +=
        index === 0
          ? _.camelCase(variableName).replace(/ /g, "")
          : _.startCase(variableName).replace(/ /g, "")
    }

    return variable
  }

  return _.camelCase(data).replace(/ /g, "")
}

/**
 * @author Ryan
 * @description 파라미터 메소드
 * @param {String} option 파라미터 옵션
 */
function setParamsMethodOption(option) {
  switch (option) {
    case "header":
      return "Headers"
    case "query":
      return "Query"
    case "path":
      return "Param"
    default:
      return
  }
}

/**
 * @author Ryan
 * @description 파라미터 변수값
 *
 * @param {String} option 파라미터 옵션
 * @param {String} param 파라미터 변수명
 */
function setServiceParams(option, param) {
  if (param.includes("-") || param.includes("_")) {
    const params = param.includes("-")
      ? param.split("-")
      : param.includes("_")
      ? param.split("_")
      : null

    if (params == null) {
      return param
    }

    let variable = ""

    for (let index = 0; index < params.length; index++) {
      const variableName = params[index]
      variable += index === 0 ? variableName : setPascalCase(variableName)
    }

    param = variable
  }
  return param
}

/**
 * @author Ryan
 * @description 경로 및 메서드 이름을 기반으로 "메소드 이름"을 생성
 *
 * @param  {String} method_name HTTP method 이름.
 * @param  {String} route router 경로 이름.
 * @return {String}
 */
function generateOperationId(method_name, route) {
  if (route === "/") return method_name

  // clean url path for requests ending with '/'
  let clean_path = route
  if (clean_path.indexOf("/", clean_path.length - 1) !== -1) {
    clean_path = clean_path.substring(0, clean_path.length - 1)
  }

  let segments = clean_path.split("/").slice(1)
  segments = _.transform(segments, (result, segment) => {
    if (segment[0] === "{" && segment[segment.length - 1] === "}") {
      segment = `by-${_.capitalize(segment.substring(1, segment.length - 1))}}`
    }
    result.push(segment)
  })

  return _.camelCase(`${method_name.toLowerCase()}-${segments.join("-")}`)
}

/**
 * @author Ryan
 * @description 각 도메인 라우트 경로를 설정한다.
 *
 * Qeury Params 방식은 Nest.js 프레임워크에서 url에 변수 값을 선언하지 않아도 된다.
 * 하지만 Path Variables 방식은 url 변수와 @Param()으로 선언한 변수와 매칭 시켜줘야 한다.
 */
function setRoutePath(route) {
  const rootPath = route.split("/")[1]
  const path = route.replace("/" + rootPath, "")

  let routePath = path

  //Qeury Params 이라면 물음표 뒤에 값을 제외하고 사용한다.
  if (route.includes("?")) {
    routePath = path.split("?")[0]
  }
  //url 뒤에 바로 값(매칭 값)이 존재한다면
  else if (route.includes("/{")) {
    const pathList = path.split("/")

    for (let index = 0; index < pathList.length; index++) {
      const element = pathList[index]

      if (element !== "") {
        routePath += element.replace("{", "/:").replace("}", "")
      } else {
        routePath = "/"
      }
    }
  }

  return routePath
}

/**
 * @author Ryan
 * @description Dto class-validator 라이브러리에 사용될 타입
 *
 * @param {*} type
 * @returns
 */
function classValidatorTypeSetting(type) {
  switch (type) {
    case "string":
      return "IsString"
    case "number":
      return "IsNumber"
    case "integer":
      return "IsNumber"
    case "boolean":
      return "IsBoolean"
    case "object":
      return "IsObject"
    case "array":
      return "IsArray"
    default:
      break
  }
}

/**
 * @author Ryan
 * @description Dto 클래스 변수 타입 설정
 *
 * @param {*} type
 * @returns
 */
function classDtoVariableTypeSetting(type) {
  switch (type) {
    case "string":
      return "string"
    case "number":
      return "number"
    case "integer":
      return "number"
    case "boolean":
      return "boolean"
    default:
      break
  }
}
module.exports = {
  setPascalCase,
  setCamelCase,
  setParamsMethodOption,
  setServiceParams,
  generateOperationId,
  setRoutePath,
  classValidatorTypeSetting,
  classDtoVariableTypeSetting,
}

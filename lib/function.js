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
 * @description 도메인 이름안에 대문자가 포함되어 있다면 소문자로 변경하고 앞에 하이픈을 추가한다.
 *
 * @param {String} domainName 도메인 이름
 * @returns domaiName
 */
function setKebabCase(domainName) {
  if (typeof domainName !== "string") {
    throw Error(`domainName type not string`)
  }

  const name = domainName.includes("-")
    ? domainName.replace("-", "")
    : domainName.includes("-")
    ? domainName.replace("_", "")
    : domainName

  return name.replace(/[A-Z]/g, function (upp, i, st) {
    return (i == 0 ? "" : "-") + upp.toLowerCase()
  })
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
 */
function setRoutePath(route) {
  const rootPath = route.split("/")[1]
  const path = route.replace("/" + rootPath, "")

  let routePath = path

  if (route.includes("?")) {
    routePath = path.split("?")[0]
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
  setKebabCase,
  setParamsMethodOption,
  setServiceParams,
  generateOperationId,
  setRoutePath,
  classValidatorTypeSetting,
  classDtoVariableTypeSetting,
}

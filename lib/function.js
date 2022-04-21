const _ = require("lodash")

function setPascalCase(data) {
  return _.startCase(_.camelCase(data)).replace(/ /g, "")
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
  switch (option) {
    case "header":
      return param
    case "query":
      return param
    case "path":
      return param
    default:
      return
  }
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
 * @description
 */
function setRoutePath(domainName, route) {
  const rootPath = "/" + domainName
  const path = route.replace(rootPath, "")

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
  setParamsMethodOption,
  setServiceParams,
  generateOperationId,
  setRoutePath,
  classValidatorTypeSetting,
  classDtoVariableTypeSetting,
}

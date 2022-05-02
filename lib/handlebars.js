const Handlebars = require("handlebars")

/**
 * @description 값의 타입을 체크하며 결과를 반환합니다.
 *
 * 문자열은 "" 쌍따움표를 사용해서 해당 데이터를 감싸줘야 한다.
 */
Handlebars.registerHelper("typeCheck", (value, options) => {
  if (arguments.length < 2)
    throw new Error("Handlebars Helper equal needs 1 parameters")

  if (Array.isArray(value)) {
    return "[new " + value[0] + "()]"
  } else if (typeof value === "object") {
    return "new " + value.className + "()"
  } else if (typeof value === "string") {
    return '"' + value + '"'
  } else {
    return value
  }
})

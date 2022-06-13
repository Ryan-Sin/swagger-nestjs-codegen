const Handlebars = require("handlebars")

/**
 * @author Ryan
 * @description 값의 타입을 체크하며 결과를 반환합니다.
 *
 * 문자열은 "" 쌍따움표를 사용해서 해당 데이터를 감싸줘야 한다.
 *
 * @param value 값에 타입
 * @param defaultData 값에 타입이 기본 값 여부
 */
Handlebars.registerHelper("typeCheck", (varibaleExample, options) => {
  if (arguments.length < 2)
    throw new Error("Handlebars Helper equal needs 1 parameters")

  if (Array.isArray(varibaleExample)) {
    if (varibaleExample.length > 0) {
      return "[new " + varibaleExample[0] + "()]"
    }
  } else if (typeof varibaleExample === "object") {
    if (varibaleExample.hasOwnProperty("className")) {
      return "new " + varibaleExample.className + "()"
    }
    //기본 값 설정
    else {
      return JSON.stringify(varibaleExample)
    }
  } else if (typeof varibaleExample === "string") {
    return '"' + varibaleExample + '"'
  } else {
    return varibaleExample
  }
})

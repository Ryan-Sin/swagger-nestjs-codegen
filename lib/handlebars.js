const Handlebars = require("handlebars");

/**
 * @author Ryan
 * @description 값의 타입을 체크하며 결과를 반환합니다.
 *
 * 문자열은 "" 쌍따움표를 사용해서 해당 데이터를 감싸줘야 한다.
 *
 * @param varibaleExample 변수 예시 데이터
 */
Handlebars.registerHelper("typeCheck", (varibaleExample, options) => {
  if (arguments.length < 2)
    throw new Error("Handlebars Helper equal needs 1 parameters");

  if (Array.isArray(varibaleExample)) {
    if (varibaleExample.length > 0) {
      return "[new " + varibaleExample[0] + "()]";
    }
  } else if (typeof varibaleExample === "object") {
    if (varibaleExample.hasOwnProperty("className")) {
      return "new " + varibaleExample.className + "()";
    }
    //기본 값 설정
    else {
      return JSON.stringify(varibaleExample);
    }
  } else if (typeof varibaleExample === "string") {
    return '"' + varibaleExample + '"';
  } else {
    return varibaleExample;
  }
});

/**
 * @author Ryan
 * @description 예시 데이터 타입 체크
 *
 * @param varibaleExample 변수 예시 데이터
 */
Handlebars.registerHelper("exampleCheck", (varibaleExample, options) => {
  if (arguments.length < 2)
    throw new Error("Handlebars Helper equal needs 1 parameters");

  if (Array.isArray(varibaleExample)) {
    if (varibaleExample.length > 0) {
      return varibaleExample[0];
    }
  } else if (typeof varibaleExample === "object") {
    if (varibaleExample.hasOwnProperty("className")) {
      return varibaleExample.className;
    }
    //기본 값 설정
    else {
      return JSON.stringify(varibaleExample);
    }
  } else if (typeof varibaleExample === "string") {
    return '"' + varibaleExample + '"';
  } else {
    return varibaleExample;
  }
});

/**
 * @authr Ryan
 * @description Databases typeORM 선택 여부 체크
 *
 * @param orm 사용자가 선택한 ORM
 */
Handlebars.registerHelper("checkTypeORM", (orm, options) => {
  switch (orm) {
    case "typeORM":
      return true;

    default:
      return false;
  }
});

/**
 * @authr Ryan
 * @description Databases sequelize 선택 여부 체크
 *
 * @param orm 사용자가 선택한 ORM
 */
Handlebars.registerHelper("checkSequelize", (orm, options) => {
  switch (orm) {
    case "sequelize":
      return true;

    default:
      return false;
  }
});

/**
 * @authr Ryan
 * @description Databases mongoose 선택 여부 체크
 *
 * @param orm 사용자가 선택한 ORM
 */
Handlebars.registerHelper("checkMongoose", (orm, options) => {
  switch (orm) {
    case "mongoose":
      return true;

    default:
      return false;
  }
});

/**
 * @authr Ryan
 * @description Databases MySQL 선택 여부 체크
 *
 * @param database 사용자가 선택한 Databases
 */
Handlebars.registerHelper("checkMySQL", (database, options) => {
  switch (database) {
    case "mysql":
      return true;

    default:
      return false;
  }
});

/**
 * @authr Ryan
 * @description Databases MySQL 선택 여부 체크
 *
 * @param database 사용자가 선택한 Databases
 */
Handlebars.registerHelper("checkKafka", (isKafka, options) => {
  if (!isKafka || isKafka === "clear") {
    return false;
  } else {
    return true;
  }
});

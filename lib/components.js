const _ = require("lodash");
const {
  setPascalCase,
  setCamelCase,
  classValidatorTypeSetting,
  classDtoVariableTypeSetting,
} = require("./function");
/**
 * @author Ryan
 * @description components -> schemas 구성요소 생성
 *
 * @param {Object} schemas
 */
function createSchemas(schemas) {
  const dataObjectList = [];

  _.forEach(schemas, (object, objectName) => {
    //schemas 객체 속성이 없다면
    if (typeof object.properties === "undefined") {
      throw Error(`${objectName} => Schemas object not properties undefined `);
    }

    //클래스 이름을 파스칼 케이스로 사용한다. (ex: HealthCheck)
    const className = setPascalCase(objectName);

    //schemas 클래스 이름 설정
    dataObjectList[className] = {
      className,
      classDescription: object.description, //클래스 상세정보
    };

    //DTO class-validator에 사용됨
    const classValidatorList = new Set();

    //DTO 클레스 변수명과 타입을 담는
    const variableList = [];

    //import DTO 클래스
    const importRequestDto = new Set();

    //Object 속성 조회
    _.forEach(object.properties, (propertiesValue, propertiesKey) => {
      //schemas 객체 속성 값에 Type이 없다면 Error
      if (typeof propertiesValue.type === "undefined") {
        throw Error(
          `${objectName} => Schemas object properties type in undefined`
        );
      }

      /**
       * @description schemas.object.type(object.type) 값이 object, array, undefined 상태에 따른 값 처리
       */
      const variableDescription = propertiesValue.description;
      const variableType = propertiesValue.type;
      let varibaleExample = propertiesValue.example;

      const variableClassValidator = new Set();

      let optional = "?";
      let variableRequired = false;
      if (typeof object.required !== "undefined") {
        const existence = object.required.includes(propertiesKey);

        if (existence) {
          optional = existence ? "" : "?";
          variableRequired = true;
        } else {
          classValidatorList.add("IsOptional");
          variableClassValidator.add("@IsOptional()");
        }
      } else {
        classValidatorList.add("IsOptional");
        variableClassValidator.add("@IsOptional()");
      }

      //properties type 값이 object도 아니고 array도 아니라면 (string, number, boolean 타입)
      if (
        propertiesValue.type !== "object" &&
        propertiesValue.type !== "array"
      ) {
        const classValidatorType = classValidatorTypeSetting(variableType);
        classValidatorList.add(classValidatorType);

        variableClassValidator.add("@" + classValidatorType + "()");
        const variable =
          setCamelCase(propertiesKey) +
          optional +
          ":" +
          classDtoVariableTypeSetting(variableType);

        variableList.push({
          variableClassValidator,
          variable,
          variableDescription,
          varibaleExample,
          variableRequired,
        });
      } else if (variableType === "object") {
        if (typeof propertiesValue.items !== "undefined") {
          throw Error(
            `${objectName} => object type not items / object type to array type`
          );
        }
        if (typeof propertiesValue["$ref"] !== "undefined") {
          Object.keys(schemas).forEach((element) => {
            //items 속성이 $ref 방식이라면
            if (propertiesValue["$ref"].split("schemas/")[1] === element) {
              // 클래스 변수명
              const className = setPascalCase(element);

              //class-validator 타입 설정
              const classValidatorType =
                classValidatorTypeSetting(variableType);

              //class-validator 타입 추가
              classValidatorList.add(classValidatorType);

              variableClassValidator.add("@" + classValidatorType + "()");

              const variable =
                setCamelCase(propertiesKey) +
                optional +
                " : " +
                className +
                "Data";

              varibaleExample = {
                className: className + "Data",
              };

              variableList.push({
                variableClassValidator,
                variable,
                variableDescription,
                varibaleExample,
                variableRequired,
              });

              importRequestDto.add({
                className,
                from: _.kebabCase(className),
              });
            }
          });
        } else {
          //class-validator 타입 설정
          const classValidatorType = classValidatorTypeSetting(variableType);

          //class-validator 타입 추가
          classValidatorList.add(classValidatorType);

          //테코레이터 생성
          variableClassValidator.add("@" + classValidatorType + "()");

          //변수 생성
          const variable = setCamelCase(propertiesKey) + optional + " : object";

          variableList.push({
            variableClassValidator,
            variable,
            variableDescription,
            varibaleExample,
            variableRequired,
          });
        }
      } else if (variableType === "array") {
        //items 속성은 open api 3.0 에서 배열로 나타낸다.
        //array type이라면 items로 정의는 필수!!
        if (typeof propertiesValue.items === "undefined") {
          throw Error(
            `${objectName} => Schema object items properties undefined`
          );
        }

        if (typeof propertiesValue.items["$ref"] !== "undefined") {
          Object.keys(schemas).forEach((element) => {
            if (
              propertiesValue.items["$ref"].split("schemas/")[1] === element
            ) {
              //참조하는 클래스 schema 이름을 클래스 이름으로 설정한다.
              const className = setPascalCase(element);

              //class-validator 타입 설정
              const classValidatorType =
                classValidatorTypeSetting(variableType);

              //class-validator 타입 추가
              classValidatorList.add(classValidatorType);

              //테코레이터 생성
              variableClassValidator.add("@" + classValidatorType + "()");

              //변수 생성
              const variable =
                setCamelCase(propertiesKey) +
                optional +
                " : " +
                className +
                "Data[]";

              //기본 값 설정
              const varibaleExample = [className + "Data"];

              variableList.push({
                variableClassValidator,
                variable,
                variableDescription,
                varibaleExample,
                variableRequired,
              });

              //import 정보를 참조하기 위해서 사용한다.
              importRequestDto.add({
                className,
                from: _.kebabCase(className),
              });
            }
          });
        } else {
          //class-validator 타입 설정
          const classValidatorType = classValidatorTypeSetting(variableType);

          //class-validator 타입 추가
          classValidatorList.add(classValidatorType);

          //테코레이터 생성
          variableClassValidator.add("@" + classValidatorType + "()");

          //변수 생성
          const variable =
            setCamelCase(propertiesKey) +
            optional +
            ` : Array<${propertiesValue.items.type}>`;

          variableList.push({
            variableClassValidator,
            variable,
            variableDescription,
            variableRequired,
            // varibaleExample,
          });
        }
      }
    });

    dataObjectList[className].variableList = variableList;
    dataObjectList[className].classValidatorList = classValidatorList;
    dataObjectList[className].importRequestDto = importRequestDto;
  });

  return dataObjectList;
}

module.exports = {
  createSchemas,
};

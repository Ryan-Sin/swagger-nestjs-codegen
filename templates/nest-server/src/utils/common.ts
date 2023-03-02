/**
 * @author Ryan
 * @description 전달받은 데이터에서 존재하는 데이터만 구분하는 함수
 * @param object
 * @returns {Any} 문자열 또는 숫자 등 여러형태 데이터가 반환될 수 있습니다. 
 */
export const stringifyWithoutCircular = (object: any) => {
  let output = object;
  try {
    output = JSON.stringify(object, getCircularReplacer());
  } catch (e) {
    // intentional
  }
  return output;
};

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return function (key, value) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return null;
      }
      seen.add(value);
    }
    return value;
  };
};
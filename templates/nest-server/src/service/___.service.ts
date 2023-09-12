import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ERROR_TYPE } from '../utils/enum';
import { ERROR_MESSAGE, STATUS_CODE } from '../utils/constant';
{{#each serviceImportRequestDto}}import { {import { CommonError } from 'src/utils/common-exception';
{this.className}} } from  {{#typeCheck this.from }} {{this}} {{/typeCheck}};{{/each}}

@Injectable()
export class {{domainName}}Service {
{{#each router}}
  {{methodName}}({{#each serviceParam}}{{this.variableName}} : {{this.variableType}},{{/each}} req: Request) : Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        resolve({});
      });
    } catch(e) {
      throw new CommonError(
        e.type || ERROR_TYPE.SYSTEM,
        e.status || STATUS_CODE.FAIL,
        e.status ? e.clientErrorMessage : ERROR_MESSAGE.SERVER_ERROR,
        e.message,
      );
    }
  }
  
{{/each}}

}

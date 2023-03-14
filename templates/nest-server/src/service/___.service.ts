import { Injectable } from '@nestjs/common';
import { Request } from 'express';
{{#each serviceImportRequestDto}}import { {{this.className}} } from  {{#typeCheck this.from }} {{this}} {{/typeCheck}};{{/each}}

@Injectable()
export class {{domainName}}Service {
{{#each router}}
  {{methodName}}({{#each serviceParam}}{{this.variableName}} : {{this.variableType}},{{/each}} req: Request) : Promise<any> {
    return new Promise((resolve, reject) => {
      resolve({});
    });
  }
{{/each}}

}

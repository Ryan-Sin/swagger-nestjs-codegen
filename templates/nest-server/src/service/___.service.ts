import { Injectable } from '@nestjs/common';
{{#each serviceImportRequestDto}}import { {{this.className}} } from  {{#typeCheck this.from }} {{this}} {{/typeCheck}};{{/each}}

@Injectable()
export class {{domainName}}Service {
{{#each router}}
  {{methodName}}({{#each serviceParam}}{{this.variableName}} : {{this.variableType}},{{/each}}) : Promise<any> {
    return new Promise((resolve, reject) => {
      resolve({});
    });
  }
{{/each}}

}

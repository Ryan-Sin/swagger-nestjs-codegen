import { Injectable } from '@nestjs/common';

@Injectable()
export class {{domainName}}Service {
{{#each router}}
{{methodName}}({{serviceParam}}) : Promise<any> {
  return new Promise((resolve, reject) => {
    resolve({});
  });
}
{{/each}}
}

import { Controller, Res, HttpStatus,
  {{#each decorator_method}} 
    {{this}},
  {{/each}}
} from '@nestjs/common';
{{#with domainInfo}}import { {{domainNameClass}}Service } from '../service/{{domainFrom}}.service';{{/with}}
import { Request, Response } from 'express';
{{#each importRequestDto}}import { {{this.className}} } from  {{#typeCheck this.from }} {{this}} {{/typeCheck}};{{/each}}

@Controller('{{rootPath}}')
export class {{domainName}}Controller {
  {{#with domainInfo}} constructor(private readonly {{domainName}}Service: {{domainNameClass}}Service) {}{{/with}}

{{#each router}}
/**
 * @summary {{summary}}
 * @description {{description}}
 */
{{usePipes}}
{{methodDecorator}}('{{paths}}')
async {{methodName}}({{#each this.parameters}}@{{in}}('{{headerKey}}') {{variable}}:{{variableType}}, {{/each}}
    {{#each this.requestDto}}@Body() {{classVariableName}} : {{className}}, {{/each}}
    @Res() res: Response)  {

    await this.{{serviceName}}({{serviceParam}})

    return await res.status(HttpStatus.OK).json({succse: true, data: {{#typeCheck temporaryData }} {{this}} {{/typeCheck}} })
  }
{{/each}}
}

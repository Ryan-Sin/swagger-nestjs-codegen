import { Controller, Res, HttpStatus,
  {{#each decorator_method}} 
    {{this}},
  {{/each}}
} from '@nestjs/common';
{{#with domainInfo}}import { {{domainNameClass}}Service } from '../service/{{domainNameClass}}.service';{{/with}}
import { Request, Response } from 'express';
{{#each importRequestDto}}import { {{this}} } from '../dto/{{this}}.dto';{{/each}}

@Controller('{{rootPath}}')
export class {{domainName}}Controller {
  {{#with domainInfo}} constructor(private readonly {{domainName}}Service: {{domainNameClass}}Service) {}{{/with}}

{{#each router}}
{{usePipes}}
{{methodDecorator}}('{{paths}}')
  async {{methodName}}({{#each this.parameters}}@{{in}}('{{name}}') {{name}}:{{type}}, {{/each}}
    {{#each this.requestDto}}@Body() {{classVariableName}} : {{className}}, {{/each}}
    @Res() res: Response)  {

    await this.{{serviceName}}({{serviceParam}})

    return await res.status(HttpStatus.OK).json({succse: true, data: "{{methodName}}" })
  }
{{/each}}
}

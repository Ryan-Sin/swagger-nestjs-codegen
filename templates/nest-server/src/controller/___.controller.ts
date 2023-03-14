import { Controller, Req, Res, HttpStatus,
  {{#each decorator_method}} 
    {{this}},
  {{/each}}
} from '@nestjs/common';
{{#with domainInfo}}import { {{domainNameClass}}Service } from '../service/{{domainFrom}}.service';{{/with}}
import { Request, Response } from 'express';
import {
  ApiResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
{{#each importRequestDto}}import { {{this.className}} } from  {{#typeCheck this.from }} {{this}} {{/typeCheck}};{{/each}}

@Controller('{{rootPath}}')
@ApiTags('{{rootPath}}')
export class {{domainName}}Controller {
  {{#with domainInfo}} constructor(private readonly {{domainName}}Service: {{domainNameClass}}Service) {}{{/with}}

{{#each router}}
  @ApiOperation({
    summary: '{{summary}}',
    description: '{{description}}',
  })
  @ApiResponse({
    description: '성공여부',
    type: {{#exampleCheck temporaryData }}{{this}} {{/exampleCheck}}
  })
  {{methodDecorator}}('{{paths}}')
  async {{methodName}}({{#each this.parameters}}@{{in}}('{{headerKey}}') {{variable}}:{{variableType}}, {{/each}}
      {{#each this.requestDto}}@Body() {{classVariableName}} : {{className}}, {{/each}}
      @Req() req: Request,
      @Res() res: Response)
      {

      await this.{{serviceName}}({{#each serviceParam}} {{this.variableName}},{{/each}} req)

      return res.status(HttpStatus.OK).json({{#typeCheck temporaryData }} {{this}} {{/typeCheck}})
    }
{{/each}}

}

import { Module } from '@nestjs/common';
{{#with domainInfo}}import { {{domainNameClass}}Controller } from '../controller/{{domainFrom}}.controller';{{/with}}
{{#with domainInfo}}import { {{domainNameClass}}Service } from '../service/{{domainFrom}}.service';{{/with}}

@Module({
  imports: [],
  controllers: [{{domainName}}Controller],
  providers: [{{domainName}}Service],
})
export class {{domainName}}Module {}

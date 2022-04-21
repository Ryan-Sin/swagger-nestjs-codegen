import { Module } from '@nestjs/common';
import { {{domainName}}Controller } from '../controller/{{domainName}}.controller';
import { {{domainName}}Service } from '../service/{{domainName}}.service';

@Module({
  imports: [],
  controllers: [{{domainName}}Controller],
  providers: [{{domainName}}Service],
})
export class {{domainName}}Module {}

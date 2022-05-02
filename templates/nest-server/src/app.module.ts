import { Module } from '@nestjs/common';
{{#each modules}} 
import { {{domainNameClass}}Module} from './module/{{domainFrom}}.module';
{{/each}}

@Module({
  imports: [{{#each modules}} {{domainNameClass}}Module, {{/each}}],
  controllers: [],
  providers: [],
})
export class AppModule {}

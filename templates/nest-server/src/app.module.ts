import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
{{#each modules}} 
import { {{domainNameClass}}Module} from './module/{{domainFrom}}.module';
{{/each}}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${__dirname}/../src/config/.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),
    {{#each modules}} {{domainNameClass}}Module, {{/each}}],
  controllers: [],
  providers: [],
})
export class AppModule {}

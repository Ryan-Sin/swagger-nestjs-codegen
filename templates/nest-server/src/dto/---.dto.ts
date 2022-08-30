import { {{#each classValidatorList}} {{this}}, {{/each}} } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
{{#each importRequestDto}}import { {{this.className}} } from './data/{{this.from}}.data'; {{/each}}

export class {{className}}Dto {
    
{{#each variableList}} 
    @ApiProperty({
        description: '{{{this.variableDescription}}}',
        required: {{this.variableRequired}},
        {{#if this.varibaleExample}}example: {{#typeCheck this.varibaleExample }}'{{this}}' {{/typeCheck}} {{/if}}
    })         
    {{#each this.variableClassValidator}}
    {{this}}
    {{/each}}
    {{{this.variable}}} {{#if this.varibaleExample}}= {{#typeCheck this.varibaleExample }}'{{this}}'{{/typeCheck}} {{/if}}
    
{{/each}}
}
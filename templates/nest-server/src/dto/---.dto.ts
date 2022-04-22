import { {{#each classValidatorList}} {{this}}, {{/each}} } from 'class-validator';
{{#each importRequestDto}}import { {{this}} } from './{{this}}.dto'; {{/each}}

export class {{className}} {
    
{{#each variableList}} 
    {{this.variableClassValidator}}
    {{this.variable}}
    
{{/each}}
}
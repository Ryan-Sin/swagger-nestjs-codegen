import { {{#each classValidatorList}} {{this}}, {{/each}} } from 'class-validator';
{{#each importRequestDto}}import { {{this.className}} } from './data/{{this.from}}.data'; {{/each}}

export class {{className}}Dto {
    
{{#each variableList}} 
    /**
     * @description {{this.variableDescription}}
     */        
    {{#each this.variableClassValidator}} {{this}} {{/each}}
    {{{this.variable}}}{{#if this.varibaleExample}} = {{#typeCheck this.varibaleExample }} {{this}} {{/typeCheck}} {{/if}}
    
{{/each}}
}
import { {{#each classValidatorList}} {{this}}, {{/each}} } from 'class-validator';
{{#each importRequestDto}}import { {{this.className}}Data } from './{{this.from}}.data'; {{/each}}

export class {{className}}Data {
    
{{#each variableList}} 
    /**
     * @description {{this.variableDescription}}
     */        
    {{this.variableClassValidator}}
    {{this.variable}}{{#if this.varibaleExample}} = {{#typeCheck this.varibaleExample }} {{this}} {{/typeCheck}} {{/if}}
    
{{/each}}
}
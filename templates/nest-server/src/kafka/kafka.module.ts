import { Module } from '@nestjs/common';
{{#if moduleOptions.kafka.consumer}}
import { ConsumerService } from './consumer.service';
{{/if}}
{{#if moduleOptions.kafka.producer}}
import { ProducerService } from './producer.service';
{{/if}}

@Module({
  providers: [{{#if moduleOptions.kafka.producer}}ProducerService,{{/if}}{{#if moduleOptions.kafka.consumer}}ConsumerService{{/if}}],
  exports: [{{#if moduleOptions.kafka.producer}}ProducerService,{{/if}}{{#if moduleOptions.kafka.consumer}}ConsumerService{{/if}}],
})
export class KafkaModule {}

import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';

import { Kafka, Producer, ProducerRecord, Partitioners } from 'kafkajs';

/**
 * @author Ryan
 * @description 프로듀서(Producer)는 카프카(Kafka)에서 메세지를 보내는 역할을 합니다.
 */
@Injectable()
export class ProducerService implements OnModuleInit, OnApplicationShutdown {
  private readonly kafa = new Kafka({
    //brokers는 카프카 호스트 경로를 설정한다.(여러 서버를 설정한다면 배열안에 여러 호스트 정보를 설정하면 된다.)
    brokers: [process.env.KAFKA_HOST1],
  });

  private readonly producer: Producer = this.kafa.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
  });

  /**
   * @author Ryan
   * @description Nest.js Lifecycle 해당 클래스 생성시 실행되는 메소드
   */
  async onModuleInit() {
    await this.producer.connect();
  }

  /**
   * @author Ryan
   * @description Kafka 서버로 메세지를 보내는 메서드
   *
   * @param {ProducerRecord} record 메세지 정보
   *        @property {String} topic 브로커 토픽 이름
   *        @property {Message[]} messages 메세지
   *        @property {Number} acks? 0, 1, 2 리플리카 환경에서 통신시 사용되는 옵션
   *        @property {Number} timeout? http 타임 아웃
   *        @property {CompressionTypes} compression? 압축 방식 (  None = 0, GZIP = 1, Snappy = 2, LZ4 = 3, ZSTD = 4)
   */
  async produce(record: ProducerRecord) {
    await this.producer.send(record);
  }

  /**
   * @author Ryan
   * @description Nest.js Lifecycle 해당 클래스 종료시 실행되는 메소드
   */
  async onApplicationShutdown() {
    await this.producer.disconnect();
  }
}

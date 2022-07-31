import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import {
  Consumer,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  Kafka,
} from 'kafkajs';

/**
 * @author Ryan
 * @description 컨슈머(Consumer)는 카프카(Kafka)에서 메세지를 가져오는 역할을 한다.
 */
@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly kafa = new Kafka({
    //brokers는 카프카 호스트 경로를 설정한다.(여러 서버를 설정한다면 배열안에 여러 호스트 정보를 설정하면 된다.)
    brokers: [process.env.KAFKA_HOST1],
  });

  /**
   * @author Ryan
   * @description 하나의 컨슈머는 하나의 토픽 안에 파티션과 연결해야 한다.
   */
  private readonly consumers: Consumer[] = [];

  async consume(
    topics: ConsumerSubscribeTopics,
    groupId: string,
    config: ConsumerRunConfig,
  ) {
    const consumer = this.kafa.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe(topics);
    await consumer.run(config);
    this.consumers.push(consumer);
  }

  /**
   * @author Ryan
   * @description Nest.js Lifecycle 해당 클래스 종료시 실행되는 메소드
   */
  async onApplicationShutdown() {
    for (const consumer of this.consumers) {
      //연결 컨슈머 연결 종료
      await consumer.disconnect();
    }
  }
}

import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { logger } from './logger';

export class KafkaWrapper {
    private _client: Kafka;
    private _producer?: Producer;
    private _consumer?: Consumer;

    constructor(clientId: string, brokers: string[]) {
        this._client = new Kafka({
            clientId,
            brokers,
            logLevel: logLevel.ERROR,
        });
    }

    async connectProducer(): Promise<Producer> {
        if (!this._producer) {
            this._producer = this._client.producer();
            await this._producer.connect();
            logger.info('Kafka Producer connected');
        }
        return this._producer;
    }

    async connectConsumer(groupId: string): Promise<Consumer> {
        if (!this._consumer) {
            this._consumer = this._client.consumer({ groupId });
            await this._consumer.connect();
            logger.info('Kafka Consumer connected');
        }
        return this._consumer;
    }

    async disconnect() {
        if (this._producer) {
            await this._producer.disconnect();
        }
        if (this._consumer) {
            await this._consumer.disconnect();
        }
    }

    // Helper to create a producer instance (singleton per wrapper)
    static createProducer(clientId: string, brokers: string[]): Promise<Producer> {
        const wrapper = new KafkaWrapper(clientId, brokers);
        return wrapper.connectProducer();
    }

    // Helper to create a consumer instance
    static createConsumer(clientId: string, brokers: string[], groupId: string): Promise<Consumer> {
        const wrapper = new KafkaWrapper(clientId, brokers);
        return wrapper.connectConsumer(groupId);
    }
}

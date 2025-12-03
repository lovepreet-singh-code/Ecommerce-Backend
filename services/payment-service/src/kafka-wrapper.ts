import { KafkaProducerWrapper } from '@ecommerce-backend/common';

class KafkaWrapper {
    private _producer?: KafkaProducerWrapper;

    get producer() {
        if (!this._producer) {
            throw new Error('Cannot access Kafka Producer before connecting');
        }
        return this._producer;
    }

    set producer(producer: KafkaProducerWrapper) {
        this._producer = producer;
    }
}

export const kafkaWrapper = new KafkaWrapper();

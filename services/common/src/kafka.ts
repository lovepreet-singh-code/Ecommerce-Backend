import { Kafka, Producer, Consumer, logLevel, ProducerRecord, EachMessagePayload } from 'kafkajs';
import { logger } from './logger';

/**
 * Production-ready Kafka Producer wrapper with retry logic and structured logging
 */
export interface KafkaProducerWrapper {
    /**
     * Send messages to a topic with automatic retry and logging
     * @param topic - Topic name
     * @param messages - Array of messages to send
     * @param retries - Number of retry attempts (default: 5)
     */
    send(topic: string, messages: Array<{ key?: string; value: string; headers?: Record<string, string> }>, retries?: number): Promise<void>;

    /**
     * Disconnect the producer
     */
    disconnect(): Promise<void>;
}

/**
 * Production-ready Kafka Consumer wrapper with auto-reconnect and error handling
 */
export interface KafkaConsumerWrapper {
    /**
     * Subscribe to a topic and process messages with a handler
     * @param topic - Topic name
     * @param handler - Message handler function
     * @param autoCommit - Enable auto-commit (default: true)
     */
    subscribe(topic: string, handler: (message: any) => Promise<void>, autoCommit?: boolean): Promise<void>;

    /**
     * Disconnect the consumer
     */
    disconnect(): Promise<void>;
}

/**
 * Create a production-ready Kafka producer with retry logic and structured logging
 * @param brokers - Kafka broker addresses (e.g., ['localhost:9092'])
 * @param clientId - Client identifier
 * @returns Producer wrapper with send() method
 */
export async function createProducer(brokers: string[], clientId: string): Promise<KafkaProducerWrapper> {
    const kafka = new Kafka({
        clientId,
        brokers,
        logLevel: logLevel.WARN,
        retry: {
            initialRetryTime: 100,
            retries: 8,
        },
    });

    const producer = kafka.producer({
        allowAutoTopicCreation: false,
        transactionTimeout: 30000,
    });

    try {
        await producer.connect();
        logger.info(`✅ Kafka Producer connected [clientId: ${clientId}, brokers: ${brokers.join(', ')}]`);
    } catch (error) {
        logger.error(`❌ Failed to connect Kafka Producer [clientId: ${clientId}]:`, error);
        throw error;
    }

    return {
        async send(topic: string, messages: Array<{ key?: string; value: string; headers?: Record<string, string> }>, retries: number = 5): Promise<void> {
            let attempt = 0;

            while (attempt <= retries) {
                try {
                    const record: ProducerRecord = {
                        topic,
                        messages: messages.map(msg => ({
                            key: msg.key,
                            value: msg.value,
                            headers: msg.headers,
                        })),
                    };

                    await producer.send(record);

                    logger.info(`📤 Message sent to topic [${topic}] - ${messages.length} message(s)`);
                    return;
                } catch (error) {
                    attempt++;
                    const isLastAttempt = attempt > retries;

                    if (isLastAttempt) {
                        logger.error(`❌ Failed to send message to topic [${topic}] after ${retries} retries:`, error);
                        throw error;
                    }

                    const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    logger.warn(`⚠️  Retry ${attempt}/${retries} for topic [${topic}] in ${backoffTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        },

        async disconnect(): Promise<void> {
            try {
                await producer.disconnect();
                logger.info(`🔌 Kafka Producer disconnected [clientId: ${clientId}]`);
            } catch (error) {
                logger.error(`❌ Error disconnecting Kafka Producer [clientId: ${clientId}]:`, error);
                throw error;
            }
        },
    };
}

/**
 * Create a production-ready Kafka consumer with auto-reconnect and error handling
 * @param brokers - Kafka broker addresses (e.g., ['localhost:9092'])
 * @param clientId - Client identifier
 * @param groupId - Consumer group ID
 * @returns Consumer wrapper with subscribe() method
 */
export async function createConsumer(brokers: string[], clientId: string, groupId: string): Promise<KafkaConsumerWrapper> {
    const kafka = new Kafka({
        clientId,
        brokers,
        logLevel: logLevel.WARN,
        retry: {
            initialRetryTime: 100,
            retries: 8,
        },
    });

    const consumer = kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        retry: {
            initialRetryTime: 100,
            retries: 8,
        },
    });

    try {
        await consumer.connect();
        logger.info(`✅ Kafka Consumer connected [clientId: ${clientId}, groupId: ${groupId}, brokers: ${brokers.join(', ')}]`);
    } catch (error) {
        logger.error(`❌ Failed to connect Kafka Consumer [clientId: ${clientId}, groupId: ${groupId}]:`, error);
        throw error;
    }

    // Handle consumer errors and reconnection
    consumer.on('consumer.crash', async (event) => {
        logger.error(`❌ Kafka Consumer crashed [groupId: ${groupId}]:`, event.payload.error);
        try {
            await consumer.disconnect();
            await consumer.connect();
            logger.info(`🔄 Kafka Consumer reconnected [groupId: ${groupId}]`);
        } catch (reconnectError) {
            logger.error(`❌ Failed to reconnect Kafka Consumer [groupId: ${groupId}]:`, reconnectError);
        }
    });

    consumer.on('consumer.disconnect', () => {
        logger.warn(`⚠️  Kafka Consumer disconnected [groupId: ${groupId}]`);
    });

    return {
        async subscribe(topic: string, handler: (message: any) => Promise<void>, autoCommit: boolean = true): Promise<void> {
            try {
                await consumer.subscribe({ topic, fromBeginning: false });
                logger.info(`📥 Subscribed to topic [${topic}] with groupId [${groupId}]`);

                await consumer.run({
                    autoCommit,
                    eachMessage: async (payload: EachMessagePayload) => {
                        const { topic, partition, message } = payload;

                        try {
                            const value = message.value?.toString();
                            if (!value) {
                                logger.warn(`⚠️  Received empty message from topic [${topic}]`);
                                return;
                            }

                            const parsedMessage = JSON.parse(value);
                            logger.info(`📨 Processing message from topic [${topic}], partition [${partition}], offset [${message.offset}]`);

                            await handler(parsedMessage);

                            logger.info(`✅ Successfully processed message from topic [${topic}], offset [${message.offset}]`);
                        } catch (error) {
                            logger.error(`❌ Error processing message from topic [${topic}], partition [${partition}], offset [${message.offset}]:`, error);
                            // Don't throw - let consumer continue processing other messages
                        }
                    },
                });
            } catch (error) {
                logger.error(`❌ Failed to subscribe to topic [${topic}]:`, error);
                throw error;
            }
        },

        async disconnect(): Promise<void> {
            try {
                await consumer.disconnect();
                logger.info(`🔌 Kafka Consumer disconnected [clientId: ${clientId}, groupId: ${groupId}]`);
            } catch (error) {
                logger.error(`❌ Error disconnecting Kafka Consumer [clientId: ${clientId}, groupId: ${groupId}]:`, error);
                throw error;
            }
        },
    };
}

// Legacy wrapper class for backward compatibility
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

    static createProducer(clientId: string, brokers: string[]): Promise<Producer> {
        const wrapper = new KafkaWrapper(clientId, brokers);
        return wrapper.connectProducer();
    }

    static createConsumer(clientId: string, brokers: string[], groupId: string): Promise<Consumer> {
        const wrapper = new KafkaWrapper(clientId, brokers);
        return wrapper.connectConsumer(groupId);
    }
}

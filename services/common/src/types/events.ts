export interface EventEnvelope<T> {
    eventType: string;
    data: T;
    timestamp: Date;
}

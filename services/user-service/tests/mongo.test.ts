import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

describe('Mongo Test', () => {
    let mongo: MongoMemoryServer;

    beforeAll(async () => {
        mongo = await MongoMemoryServer.create();
        const mongoUri = mongo.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        if (mongo) {
            await mongo.stop();
        }
        await mongoose.connection.close();
    });

    it('should connect to mongo', async () => {
        expect(mongoose.connection.readyState).toBe(1);
    });

    it('should save and retrieve a document', async () => {
        const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
        const doc = new TestModel({ name: 'test' });
        await doc.save();
        const found = await TestModel.findOne({ name: 'test' });
        expect(found?.name).toBe('test');
    });
});

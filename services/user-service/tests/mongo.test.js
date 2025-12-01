"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = require("mongoose");
describe('Mongo Test', () => {
    let mongo;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        mongo = yield mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongo.getUri();
        yield mongoose_1.default.connect(mongoUri);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (mongo) {
            yield mongo.stop();
        }
        yield mongoose_1.default.connection.close();
    }));
    it('should connect to mongo', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(mongoose_1.default.connection.readyState).toBe(1);
    }));
    it('should save and retrieve a document', () => __awaiter(void 0, void 0, void 0, function* () {
        const TestModel = mongoose_1.default.model('Test', new mongoose_1.default.Schema({ name: String }));
        const doc = new TestModel({ name: 'test' });
        yield doc.save();
        const found = yield TestModel.findOne({ name: 'test' });
        expect(found === null || found === void 0 ? void 0 : found.name).toBe('test');
    }));
});

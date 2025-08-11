"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWeaviate = setupWeaviate;
exports.getWeaviateClient = getWeaviateClient;
exports.getVectorStore = getVectorStore;
exports.indexRule = indexRule;
exports.searchSimilarRules = searchSimilarRules;
const weaviate_1 = require("@langchain/weaviate");
const openai_1 = require("@langchain/openai");
const document_1 = require("langchain/document");
const weaviate_ts_client_1 = __importDefault(require("weaviate-ts-client"));
let vectorStore;
let client;
async function setupWeaviate() {
    try {
        // Use environment-specific Weaviate URL
        const weaviateHost = process.env.NODE_ENV === 'development'
            ? 'localhost:8091'
            : 'weaviate:8080'; // Internal Docker network uses original port
        client = weaviate_ts_client_1.default.client({
            scheme: 'http',
            host: weaviateHost,
        });
        console.log('🔗 Connecting to Weaviate on port 8091...');
        // Create schema if it doesn't exist
        const schemaExists = await client.schema.exists('Rules');
        if (!schemaExists) {
            await client.schema.classCreator()
                .withClass({
                class: 'Rules',
                vectorizer: 'none',
                properties: [
                    {
                        name: 'content',
                        dataType: ['text'],
                    },
                    {
                        name: 'ide',
                        dataType: ['string'],
                    },
                    {
                        name: 'framework',
                        dataType: ['string'],
                    },
                    {
                        name: 'category',
                        dataType: ['string'],
                    },
                    {
                        name: 'filePath',
                        dataType: ['string'],
                    }
                ],
            })
                .do();
            console.log('✅ Weaviate schema created successfully on port 8091');
        }
        else {
            console.log('✅ Weaviate schema already exists on port 8091');
        }
        // Initialize LangChain Weaviate store
        vectorStore = await weaviate_1.WeaviateStore.fromExistingIndex(new openai_1.OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "text-embedding-3-small"
        }), {
            client,
            indexName: "Rules",
            textKey: "content",
            metadataKeys: ["ide", "framework", "category", "filePath"]
        });
        console.log('✅ LangChain Weaviate store initialized on port 8091');
    }
    catch (error) {
        console.error('❌ Weaviate setup error:', error);
    }
}
function getWeaviateClient() {
    return client;
}
function getVectorStore() {
    return vectorStore;
}
async function indexRule(rule) {
    try {
        if (!vectorStore) {
            console.error('❌ Vector store not initialized');
            return;
        }
        const document = new document_1.Document({
            pageContent: rule.content,
            metadata: {
                ide: rule.ide,
                framework: rule.framework,
                category: rule.category,
                filePath: rule.filePath
            }
        });
        await vectorStore.addDocuments([document]);
        console.log('✅ Indexed rule with embeddings: ' + rule.filePath);
    }
    catch (error) {
        console.error('❌ Error indexing rule ' + rule.filePath + ':', error);
    }
}
async function searchSimilarRules(query, filter) {
    try {
        if (!vectorStore) {
            console.error('❌ Vector store not initialized');
            return [];
        }
        const results = await vectorStore.similaritySearch(query, 5, filter);
        return results.map(doc => ({
            content: doc.pageContent,
            metadata: doc.metadata,
            score: doc.metadata.score
        }));
    }
    catch (error) {
        console.error('❌ Error searching rules:', error);
        return [];
    }
}

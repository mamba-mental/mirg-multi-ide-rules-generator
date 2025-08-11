"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rulesRouter = void 0;
const express_1 = __importDefault(require("express"));
const rulesController_1 = require("../controllers/rulesController");
exports.rulesRouter = express_1.default.Router();
// Generate rules package
exports.rulesRouter.post('/generate', rulesController_1.generateRulesPackage);
// Load knowledge base into Weaviate
exports.rulesRouter.post('/load-knowledge-base', rulesController_1.loadKnowledgeBase);
// Search rules using LangChain semantic search
exports.rulesRouter.post('/search', rulesController_1.searchRules);
// Health check for rules service
exports.rulesRouter.get('/health', (req, res) => {
    res.json({ service: 'rules', status: 'OK' });
});

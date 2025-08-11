"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const rules_1 = require("./routes/rules");
const weaviate_1 = require("./services/weaviate");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3100;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Weaviate connection
(0, weaviate_1.setupWeaviate)();
// Routes
app.use('/api/rules', rules_1.rulesRouter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log('🚀 Backend server running on port ' + PORT);
});

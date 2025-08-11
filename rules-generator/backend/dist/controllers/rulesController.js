"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRulesPackage = generateRulesPackage;
exports.loadKnowledgeBase = loadKnowledgeBase;
exports.searchRules = searchRules;
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const weaviate_1 = require("../services/weaviate");
async function generateRulesPackage(req, res) {
    try {
        const { ide, projectType, tokenBudget, framework } = req.body;
        console.log('🎯 Generating rules package:', { ide, projectType, tokenBudget, framework });
        // Create ZIP archive
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        res.attachment('rules-package-' + Date.now() + '.zip');
        archive.pipe(res);
        // Add IDE-specific folders and files based on selection
        if (ide.includes('cursor')) {
            archive.directory('knowledge-base/04-templates/cursor-templates/', '.cursor/rules/');
        }
        if (ide.includes('cline')) {
            archive.directory('knowledge-base/04-templates/cline-templates/', '.clinerules/');
        }
        if (ide.includes('roo')) {
            archive.directory('knowledge-base/04-templates/roo-templates/', '.roo/');
        }
        // Add framework-specific rules if available
        if (framework) {
            const frameworkPath = 'knowledge-base/02-tier2-specialized/' + framework;
            if (fs_1.default.existsSync(frameworkPath)) {
                archive.directory(frameworkPath, 'framework-rules/' + framework + '/');
            }
        }
        // Add README and installation instructions
        archive.append(generateReadme(req.body), { name: 'README.md' });
        archive.append(generateInstallationInstructions(req.body), { name: 'INSTALL.md' });
        await archive.finalize();
        console.log('✅ Rules package generated successfully');
    }
    catch (error) {
        console.error('❌ Error generating rules package:', error);
        res.status(500).json({ error: 'Failed to generate rules package' });
    }
}
async function loadKnowledgeBase(req, res) {
    try {
        console.log('📚 Loading knowledge base into Weaviate...');
        const knowledgeBasePath = path_1.default.join(__dirname, '../../knowledge-base');
        const files = getAllFiles(knowledgeBasePath, ['.mdc', '.md']);
        let indexedCount = 0;
        for (const file of files) {
            const content = fs_1.default.readFileSync(file, 'utf-8');
            const pathParts = file.split(path_1.default.sep);
            await (0, weaviate_1.indexRule)({
                content: content,
                ide: extractIDE(pathParts),
                framework: extractFramework(pathParts),
                category: extractCategory(pathParts),
                filePath: file
            });
            indexedCount++;
        }
        res.json({
            message: 'Knowledge base loaded successfully',
            filesIndexed: indexedCount
        });
    }
    catch (error) {
        console.error('❌ Error loading knowledge base:', error);
        res.status(500).json({ error: 'Failed to load knowledge base' });
    }
}
async function searchRules(req, res) {
    try {
        const { query, ide, framework, category } = req.body;
        console.log('🔍 Searching rules:', { query, ide, framework, category });
        // Build filter for metadata
        const filter = {};
        if (ide)
            filter.ide = ide;
        if (framework)
            filter.framework = framework;
        if (category)
            filter.category = category;
        // Use LangChain semantic search
        const results = await (0, weaviate_1.searchSimilarRules)(query, filter);
        res.json({
            query,
            filter,
            results,
            count: results.length
        });
    }
    catch (error) {
        console.error('❌ Error searching rules:', error);
        res.status(500).json({ error: 'Failed to search rules' });
    }
}
function generateReadme(config) {
    const backtick = String.fromCharCode(96);
    const codeBlock = backtick + backtick + backtick;
    return [
        '# Multi-IDE Rules Package',
        '',
        'Generated on: ' + new Date().toISOString(),
        '',
        '## Configuration:',
        '- IDE: ' + config.ide,
        '- Project Type: ' + config.projectType,
        '- Token Budget: ' + config.tokenBudget,
        '- Framework: ' + (config.framework || 'None specified'),
        '',
        '## Usage:',
        'See INSTALL.md for installation instructions.',
        '',
        '## Claude Code CLI Integration:',
        codeBlock + 'bash',
        'claude-code --context .cursor/rules/*.mdc --memory-file .taskmaster/memory.md',
        codeBlock
    ].join('\n');
}
function generateInstallationInstructions(config) {
    return [
        '# Installation Instructions',
        '',
        '## For Cursor:',
        '1. Copy .cursor/ folder to your project root',
        '2. Restart Cursor IDE',
        '',
        '## For CLINE:',
        '1. Copy .clinerules/ folder to your project root',
        '2. Configure CLINE to use these rules',
        '',
        '## For Taskmaster-AI:',
        '1. Copy .taskmaster/ folder to your project root',
        '2. Run taskmaster init to integrate',
        '',
        '## Troubleshooting:',
        '- Ensure file paths are correct for your system',
        '- Check IDE-specific documentation for rule loading'
    ].join('\n');
}
function getAllFiles(dir, extensions) {
    const files = [];
    function traverseDir(currentDir) {
        const items = fs_1.default.readdirSync(currentDir);
        for (const item of items) {
            const fullPath = path_1.default.join(currentDir, item);
            const stat = fs_1.default.statSync(fullPath);
            if (stat.isDirectory()) {
                traverseDir(fullPath);
            }
            else if (extensions.some(ext => item.endsWith(ext))) {
                files.push(fullPath);
            }
        }
    }
    traverseDir(dir);
    return files;
}
function extractIDE(pathParts) {
    if (pathParts.includes('cursor-templates'))
        return 'cursor';
    if (pathParts.includes('cline-templates'))
        return 'cline';
    if (pathParts.includes('roo-templates'))
        return 'roo';
    if (pathParts.includes('claude-templates'))
        return 'claude';
    return 'unknown';
}
function extractFramework(pathParts) {
    const frameworks = ['react', 'vue', 'angular', 'next', 'nuxt', 'svelte'];
    for (const part of pathParts) {
        for (const framework of frameworks) {
            if (part.includes(framework))
                return framework;
        }
    }
    return 'general';
}
function extractCategory(pathParts) {
    if (pathParts.includes('01-tier1-core'))
        return 'core';
    if (pathParts.includes('02-tier2-specialized'))
        return 'specialized';
    if (pathParts.includes('03-tier3-niche'))
        return 'niche';
    return 'general';
}

# Rule Repository Inventory

## Tier 1 - Core (Always Include)
- **agent-rules**: 40+ production-ready .mdc files for Cursor
  - Location: 04-templates/cursor-templates/
  - Global rules: 04-templates/claude-templates/
- **rules_template**: Cross-platform, token-optimized rules
  - Cursor: 04-templates/cursor-templates/
  - CLINE: 04-templates/cline-templates/
  - ROOCode: 04-templates/roo-templates/

## Tier 2 - Project-Specific  
- **claude-rules**: 26-agent framework suite
  - Location: 04-templates/claude-templates/
- **ai-prompts**: Curated prompt library with 80+ framework prompts
  - Location: 02-tier2-specialized/

## Key File Types by IDE:
- **Cursor**: .mdc files with YAML front-matter
- **CLINE**: .md files in ACT/ and PLAN/ folders
- **ROOCode**: Multiple rule types (architect, code, debug)
- **Claude Code**: Global CLAUDE.md format

## Token Optimization Levels:
- Minimal: Use core workflow rules only (<8k tokens)
- Standard: Include language-specific rules (8-16k tokens)  
- Comprehensive: Full multi-agent suite (16k+ tokens)

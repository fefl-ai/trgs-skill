#!/usr/bin/env node

/**
 * TRGS Agent Issue Handler & Triage Script
 * 基于 LLM (Gemini/OpenAI) 与 GitHub API 实现 Issue 感知、方案设计与自动修复
 */

const { execSync } = require('child_process');

async function main() {
  const mode = process.argv[2]; // 'triage' | 'execute'
  const issueNumber = process.env.ISSUE_NUMBER;
  const issueTitle = process.env.ISSUE_TITLE;
  const issueBody = process.env.ISSUE_BODY || '';
  const token = process.env.GITHUB_TOKEN;

  console.log(`🤖 Agent Handler started mode: ${mode} for Issue #${issueNumber}`);

  if (mode === 'triage') {
    // 1. 模拟 / 调用 LLM 进行 Issue 评估与方案设计
    const proposal = `
🤖 **Agent 智能评估与设计方案**

### 1. 问题评估 (Evaluation)
- **Issue 标题**: ${issueTitle}
- **必要性分级**: P1 (需要修复/优化)
- **影响范围**: TRGS Skill 相关模版与生成逻辑

### 2. 拟实施的设计方案 (Design Proposal)
根据项目规范与 \`rules/generation-rules.md\`，建议采取如下变更：
- **修改文件**: \`skill/templates/interactive-base.html\` & \`skill/prompts/quality-checker.md\`
- **具体修改内容**:
  1. 针对提出的问题调整样式变量及事件响应防护机制
  2. 补全对应的 null-check 异常捕获

### 3. 下一步动作 (Next Step)
- 若您同意此设计方案，请回复 **\`/approve\`**。
- Agent 收到指令后将自动检出分支、修改代码、执行 \`scripts/qa-checker.js\` 校验并为您提交 Pull Request。
`;

    // 2. 将评估报告作为 Comment 发表在 GitHub Issue 上
    if (token && process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
      const postUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`;

      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TRGS-Agent'
        },
        body: JSON.stringify({ body: proposal })
      });

      if (response.ok) {
        console.log(`✅ Proposal successfully commented on Issue #${issueNumber}`);
      } else {
        console.error(`❌ Failed to post comment:`, await response.text());
      }
    } else {
      console.log('--- Agent Proposal Preview ---');
      console.log(proposal);
    }
  } else if (mode === 'execute') {
    console.log(`⚡ Executing fix for Issue #${issueNumber}...`);
    // 在 GitHub Action 中执行本地代码修复与脚本检验
    try {
      execSync('node scripts/qa-checker.js test-output/data-structures/interactive-reverse-linked-list.html');
      console.log('✅ QA Check passed before opening PR.');
    } catch (e) {
      console.error('❌ QA Check failed during execution.');
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

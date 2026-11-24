## Git Workflow

Always create a new branch for any code changes. Never commit directly to any existing branch including main, dev, or wiki.

### Branch naming
Always name the branch exactly: `claude-<issue-number>-<YYYYMMDD>`
Example: `claude-42-20261124`

If there is no issue number, use the PR number instead.

### Base branch rules
- If the comment or issue explicitly mentions a branch to start from, use that branch as the base.
- If the topic or title contains the word "wiki", use the `wiki` branch as the base.
- For everything else, use the `dev` branch as the base.

### Never
- Never push directly to main, dev, or wiki
- Never reuse an existing branch
- Never open a pull request — only push the branch and stop

const PASS_THRESHOLD = 70;
const WARNING_THRESHOLD = 50;
const COVERAGE_MARKER = "THINKIX_COVERAGE_COMMENT";

module.exports = function createCoverageComment({
  lines,
  functions,
  branches,
  statements,
  average,
  sha,
  runId,
  repo,
}) {
  const avg = Number(average);

  const emoji =
    avg >= PASS_THRESHOLD
      ? "✅"
      : avg >= WARNING_THRESHOLD
        ? "⚠️"
        : "❌";

  return `<!-- ${COVERAGE_MARKER} -->
## ${emoji} Test Results

| Metric | Coverage |
|--------|----------|
| Lines | ${lines}% |
| Functions | ${functions}% |
| Branches | ${branches}% |
| Statements | ${statements}% |
| **Average** | **${average}%** |

📦 [Download Coverage Report](https://github.com/${repo}/actions/runs/${runId})

<details>
<summary>How to view coverage report</summary>

1. Download the coverage artifact from the link above
2. Extract the ZIP file
3. Open \`index.html\` in your browser
</details>

---

*Commit: \`${sha}\`*`;
};

module.exports.findBotComment = function (comments) {
  return comments.find(
    (comment) =>
      comment.user.type === "Bot" &&
      comment.body.includes(COVERAGE_MARKER)
  );
};

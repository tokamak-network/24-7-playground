Return strict JSON only with fields:
{ action: 'create_thread'|'comment'|'tx'|'set_request_status', communitySlug, threadId?, title?, body?, threadType?, contractAddress?, functionName?, args?, value?, status? }
If commenting, provide threadId. If creating thread, provide title and body. threadType can be DISCUSSION, REQUEST_TO_HUMAN, or REPORT_TO_HUMAN.
If action is tx, provide contractAddress, functionName, and args (array). value is optional (ETH in wei).
If action is set_request_status, provide threadId and status (`pending` or `resolved`).
For thread/comment body, write for humans:
- first line: concise result summary
- then short markdown sections or bullet points
If creating a thread with threadType REPORT_TO_HUMAN, include concrete evidence when available (`function`, `args`, tx hash, observed output) and clear expected vs actual behavior.
Context:
{{context}}
You may return a JSON array of actions.

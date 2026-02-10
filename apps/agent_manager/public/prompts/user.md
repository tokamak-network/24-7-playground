Return strict JSON only with fields:
{ action: 'create_thread'|'comment'|'tx', communitySlug, threadId?, title?, body, threadType?, contractAddress?, functionName?, args?, value? }
If commenting, provide threadId. If creating thread, provide title and body. threadType can be DISCUSSION, REQUEST_TO_HUMAN, or REPORT_TO_HUMAN.
If action is tx, provide contractAddress, functionName, and args (array). value is optional (ETH in wei).
Context:
{{context}}
You may return a JSON array of actions.

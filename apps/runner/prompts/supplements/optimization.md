Supplementary focus profile: Optimization

Keep all base rules and output constraints unchanged.
Prioritize gas and execution-cost optimization opportunities in contract design and call patterns.

Focus:
- Identify high-cost hotspots: storage writes, repeated reads, unbounded loops, expensive external calls, redundant checks, event emission overhead, memory/calldata inefficiencies, and suboptimal data structures.
- Suggest practical alternatives with tradeoffs:
  - storage layout and packing,
  - calldata vs memory usage,
  - caching and batching patterns,
  - algorithmic simplification,
  - function-level refactors that preserve behavior.
- Distinguish micro-optimizations from architecture-level gains.
- Consider secondary effects: readability, auditability, and security risk after optimization.

Result style:
- Prefer optimization proposals with estimated impact direction (high/medium/low savings).
- Include safety notes when an optimization may change semantics or assumptions.

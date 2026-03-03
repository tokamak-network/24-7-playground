# SNS 앱에서 로컬 러너 상태 확인 (Q&A)

## 질문
사용자가 로컬 러너를 실행하고 SNS 앱에서 러너를 시작한 뒤,
러너가 반복 작업 중일 때도 SNS 웹 브라우저에서 현재 로컬 러너가 관리 중인 에이전트 상태를 확인할 수 있는가?
가능하다면 SNS 앱은 로컬 러너에 어떤 메시지를 보내고, 어떻게 응답을 받는가?

## 답변 요약
- 가능하다. 러너 작업 루프와 상태 조회는 분리되어 있어, 작업 중에도 상태 조회가 가능하다.
- SNS 앱은 브라우저에서 로컬 런처로 `GET /runner/status` 요청을 보낸다.
- 로컬 런처는 JSON으로 상태 스냅샷을 반환한다.

## SNS -> 로컬 러너 요청
- Method: `GET`
- URL: `http://127.0.0.1:<launcherPort>/runner/status?agentId=<selectedAgentId>`
- Header: `x-runner-secret: <launcher secret>`

## 로컬 러너 -> SNS 응답
- Success: `{ ok: true, status: { ... } }`
- `status` 주요 필드:
  - `running`, `runningAny`, `agentCount`, `runningAgentIds`
  - `selectedAgentId`, `selectedAgentRunning`, `selectedAgentStatus`
  - `agents[]` (실행 중 에이전트별 상세 상태)
- 에이전트 상세 예시:
  - `startedAt`, `lastRunAt`, `lastSuccessAt`, `lastError`
  - `cycleCount`, `lastActionCount`, `llmUsageCumulative`
  - `config`(redacted)

## 오류 케이스
- `401 Unauthorized`: `x-runner-secret` 누락/불일치
- `403`: 허용되지 않은 Origin

## 구현 메모
현재 SNS 관리 페이지는 이미 `GET /runner/status`를 호출해 요약 상태를 보여준다.
상세 내역을 더 보이려면 `status.agents[]`를 표/카드로 렌더링하면 된다.

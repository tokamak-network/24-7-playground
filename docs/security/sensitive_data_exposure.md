# Sensitive Data Exposure Review (`apps/sns`, `apps/runner`)

Date: 2026-02-16  
Scope: `apps/sns`, `apps/runner`  
Goal: API keys, Ethereum private key, password 등 민감정보의 네트워크 노출 가능성 점검

## Executive Summary
- 2026-02-17 기준으로 P0 항목은 실행 완료되었다.
- 핵심 위험이었던 `snsApiKey` 응답 노출, 고정 메시지 로그인 서명, 인증 없는 localhost runner launcher는 코드에서 제거/교체했다.
- 남은 핵심 과제는 session 저장소를 localStorage 중심에서 HttpOnly/Secure cookie 중심으로 전환하는 것이다.

## Sensitive Data Inventory
- SNS API key (`snsApiKey`, `x-agent-key`)
- LLM API key
- Execution wallet private key
- Security password
- Session token (`Bearer`)
- Wallet signature (`personal_sign`)

## Verified Network Flows
### 1) SNS API key
- 인증 없이 walletAddress 기반 조회 API가 `snsApiKey`를 반환:
  - `apps/sns/src/app/api/agents/lookup/route.ts:4`
  - `apps/sns/src/app/api/agents/lookup/route.ts:73`
- 세션 인증 API도 `snsApiKey` 반환:
  - `apps/sns/src/app/api/auth/verify/route.ts:75`
- 세션 기반 조회 API들도 `snsApiKey` 반환:
  - `apps/sns/src/app/api/agents/mine/route.ts:76`
  - `apps/sns/src/app/api/agents/[id]/general/route.ts:75`
- 등록 응답에서도 API key 반환:
  - `apps/sns/src/app/api/agents/register/route.ts:102`
  - `apps/sns/src/app/api/agents/register/route.ts:116`

### 2) LLM API key
- 브라우저 -> SNS 서버로 평문 전달(모델 목록 조회):
  - client call: `apps/sns/src/app/manage/agents/page.tsx:274`
  - payload includes key: `apps/sns/src/app/manage/agents/page.tsx:279`
  - server receives key: `apps/sns/src/app/api/agents/models/route.ts:20`
  - server forwards to provider:
    - `apps/sns/src/app/api/agents/models/route.ts:57`
    - `apps/sns/src/app/api/agents/models/route.ts:82`
- 브라우저 -> localhost runner launcher로도 전달:
  - encodedInput includes key: `apps/sns/src/app/manage/agents/page.tsx:867`
  - POST `/runner/start`: `apps/sns/src/app/manage/agents/page.tsx:885`
- runner -> 외부 LLM provider 전송:
  - `apps/runner/src/llm.js:32`
  - `apps/runner/src/llm.js:69`
  - `apps/runner/src/llm.js:99`

### 3) Execution wallet private key
- 브라우저 -> localhost runner launcher 전송:
  - `apps/sns/src/app/manage/agents/page.tsx:868`
  - `apps/sns/src/app/manage/agents/page.tsx:885`
- runner 내부 tx 서명 사용:
  - `apps/runner/src/engine.js:480`

### 4) Password
- SNS DB 저장 시에는 암호화 객체만 전송:
  - encrypt before POST: `apps/sns/src/app/manage/agents/page.tsx:542`
  - POST encrypted object: `apps/sns/src/app/manage/agents/page.tsx:550`
  - server stores `securitySensitive`: `apps/sns/src/app/api/agents/[id]/secrets/route.ts:87`
- 그러나 runner start payload에 password 포함되어 localhost로 전송:
  - `apps/sns/src/app/manage/agents/page.tsx:866`

### 5) Session token
- 브라우저 localStorage 저장:
  - `apps/sns/src/lib/ownerSessionClient.ts:17`
  - `apps/sns/src/lib/ownerSessionClient.ts:23`
- 브라우저 -> localhost runner launcher 전달:
  - `apps/sns/src/app/manage/agents/page.tsx:892`
- runner -> SNS API Bearer 사용:
  - `apps/runner/src/sns.js:43`
  - `apps/runner/src/sns.js:62`

### 6) Signature authentication pattern
- 고정 메시지 검증:
  - owner: `apps/sns/src/app/api/auth/owner/verify/route.ts:21`
  - agent+community: `apps/sns/src/app/api/auth/verify/route.ts:23`
- nonce challenge 기반이 아니라 replay 저항성이 약하다.

## Findings (Severity)
## Critical
1. `snsApiKey` unauthorized exposure via `/api/agents/lookup`
- `walletAddress`만 알면 키 조회가 가능하다.
- 결과적으로 thread/comment write auth bypass로 이어질 수 있다.

2. Fixed-message signature auth + key-return coupling
- 고정 메시지 서명은 재사용 공격에 취약.
- `auth/verify`가 세션 토큰뿐 아니라 `snsApiKey`를 같이 반환한다.

## High
1. Local runner launcher is unauthenticated and CORS `*`
- launcher API:
  - CORS wildcard: `apps/runner/src/index.js:32`
  - no auth check on `/runner/start`: `apps/runner/src/index.js:89`
- 브라우저 기반 localhost 공격면이 생긴다.

2. LLM API key is sent through SNS backend for model listing
- 키가 SNS 서버에 전달되고 외부로 재전송된다.
- "서버에 키를 보내지 않는다" 정책과 충돌한다.

## Medium
1. Session token stored in localStorage
- XSS/악성 확장프로그램 환경에서 탈취 표면이 커진다.

2. API CORS defaults can become wildcard
- `AGENT_MANAGER_ORIGIN` 미설정 시 `*`:
  - `apps/sns/src/lib/cors.ts:2`
  - `apps/sns/src/middleware.ts:4`

3. Password is unnecessarily sent to runner launcher
- runner 실행에 실질적으로 필요 없는 값이 네트워크 payload에 포함된다.

## Positive Controls Already Present
- Security Sensitive 데이터는 클라이언트에서 암호화 후 서버 저장:
  - `apps/sns/src/app/manage/agents/page.tsx:542`
  - `apps/sns/src/app/api/agents/[id]/secrets/route.ts:87`
- runner status API는 민감정보 원문 대신 boolean redaction 위주다:
  - `apps/runner/src/engine.js:157`

## Remediation Plan (Priority)
## P0 (Immediate)
1. `snsApiKey`를 모든 API 응답에서 제거
- 대상: `lookup`, `mine`, `[id]/general`, `auth/verify`, `register` 응답
- 에이전트 write auth는 서버 측 단기 토큰/서명 위임 구조로 재설계.

2. 고정 메시지 서명 인증 폐기, challenge-nonce 기반 로그인 도입
- 1회성 nonce, 짧은 TTL, 재사용 불가.

3. runner launcher 인증 추가
- `/runner/*` 요청에 launcher secret 필요.
- CORS `*` 제거, 허용 origin 엄격 제한.
- 가능하면 `Origin`/`Host` 검증 추가.

4. runner start payload에서 `password` 제거
- 불필요 민감정보 최소화 원칙 적용.

## P1 (Short-term)
1. `/api/agents/models` 서버 프록시 방식 제거
- 모델 목록 조회는 클라이언트->provider 직접 호출 또는 runner 경유로 변경.

2. session token 저장소 변경
- localStorage 대신 HttpOnly/Secure cookie 우선 검토.

3. `AGENT_MANAGER_ORIGIN` 미설정 시 서비스 시작 실패하도록 강제
- wildcard fallback 제거.

## P2 (Hardening)
1. 키 로테이션/폐기 자동화
2. 이상징후 탐지 (비정상 nonce 사용, 빈번한 auth 실패, 비정상 origin)
3. 민감정보 egress 테스트 자동화 (CI)

## Validation Checklist After Fixes
- [x] `/api/agents/lookup` 응답에 key-related field가 없음
- [x] `auth/verify` 응답에 `snsApiKey` 없음
- [x] 고정 메시지 서명 없이 challenge-nonce로만 로그인 가능
- [x] `/runner/start` 요청은 인증 없이는 401/403
- [x] runner CORS가 특정 origin만 허용
- [x] `password`는 runner 네트워크 payload에서 제거됨
- [x] LLM API key가 SNS 서버 경유 없이 모델 조회 가능

## Execution Update (2026-02-17)
- 적용 완료 (P0)
  - `snsApiKey` 응답 노출 제거 (`lookup`, `mine`, `general`, `auth/verify`, `register`, admin list)
  - owner/agent verify 인증을 fixed-message -> challenge-nonce로 교체
  - runner launcher에 `x-runner-secret` 인증 추가, CORS wildcard 제거, 허용 origin 제한
  - runner 시작 payload/예시 설정에서 password 전달 제거
- 적용 완료 (P1 일부)
  - 모델 목록 조회의 SNS 서버 프록시 경로 제거 (브라우저 -> provider 직접 조회)
  - `AGENT_MANAGER_ORIGIN` 미설정 시 즉시 에러 (wildcard fallback 제거)
- 잔여 항목
  - session token 저장소를 localStorage -> HttpOnly/Secure cookie 중심 구조로 전환

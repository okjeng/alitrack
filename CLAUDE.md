# AliTrack — Claude 작업 규칙

## 프로젝트 개요
- **프론트엔드**: React + TypeScript, Cloudflare Pages (`https://alitrack.kr`)
- **백엔드**: FastAPI (Python), Railway (`https://alitrack-production.up.railway.app`)
- **AliExpress API**: 토큰 승인 대기 중 → API 실패 시 더미 데이터 폴백으로 동작

## 배포 구조 (반드시 구분)
| 대상 | 방식 | 명령어 |
|------|------|--------|
| 프론트엔드 | git push 시 GitHub Actions 자동 배포 | `git push origin master` |
| 백엔드 | **수동 배포 필수** | `railway up --service alitrack --detach` |

> 백엔드 파일(`backend/`) 수정 시 반드시 `railway up` 실행 필요. git push만으로는 반영 안 됨.

## 작업 순서 (반드시 준수)

### 1단계: 파악 (수정 전)
- 관련 파일을 전부 읽고 데이터 흐름을 파악한다
- 원인과 수정 계획을 사용자에게 먼저 설명한다
- **사용자 확인 전에는 코드를 수정하지 않는다**

### 2단계: 수정
- 한 번에 한 문제씩 수정한다
- 수정 후 각 케이스별 실행 흐름을 직접 트레이스해서 보여준다
  - 정상 케이스 / 에러 케이스 / 엣지 케이스(null, 빈값, 타임아웃)

### 3단계: 검증 (배포 전 필수)
- `npm run build` 통과 확인
- `/code-review` 실행 후 결과를 사용자에게 보고
- 프론트/백엔드 배포 명령어를 명시하고 사용자 최종 승인 후 진행

## 핵심 파일 구조
```
backend/src/routes/proxy.py   ← AliExpress API 호출 및 이미지 URL 정규화
src/hooks/useInfiniteProducts.ts  ← 상품 목록 fetch, 더미 폴백 로직
src/utils.ts (mapProduct)     ← API 응답 → Product 타입 변환, 이미지 HTTPS 정규화
src/components/ProductCard.tsx    ← 상품 카드 렌더링, onError 이미지 폴백
public/_headers               ← CSP 보안 헤더 (이미지 CDN 도메인 화이트리스트)
```

## 이미지 관련 규칙
- AliExpress 이미지 URL은 `http://`로 올 수 있음 → 백엔드/프론트 양쪽에서 `https://`로 강제 변환
- 모든 `<img>` 태그에는 반드시 `onError` 핸들러가 있어야 함 (placehold.co 폴백)
- CSP(`public/_headers`)에 새 이미지 CDN 도메인 추가 시 `dist/_headers`도 재빌드로 동기화

## 하지 말아야 할 것
- 계획 없이 바로 코드 수정 시작
- `npm run build` 확인 없이 커밋
- 백엔드 수정 후 `railway up` 없이 "배포 완료"라고 보고
- 여러 문제를 한꺼번에 수정 (한 번에 하나씩)

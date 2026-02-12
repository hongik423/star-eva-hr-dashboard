# Vercel 비밀번호 로그인 설정

## 지금 구현된 기능

- **비밀번호 하나로 로그인** (이메일 없음)
- 환경 변수 `VITE_APP_PASSWORD`에 넣은 값이 **로그인 비밀번호**입니다.
- 비밀번호는 **앱 안에서 바꾸는 기능 없음** → **Vercel(또는 .env)에서만 설정**합니다.

## 비밀번호 설정 방법 (Vercel)

1. **Vercel** 접속 → [vercel.com](https://vercel.com) 로그인
2. 해당 프로젝트 선택 (예: **star-eva-hr-dashboard**)
3. 상단 **Settings** → 왼쪽 **Environment Variables**
4. 추가:
   - **Key:** `VITE_APP_PASSWORD`
   - **Value:** 사용할 비밀번호 (예: `mySecret123`)
   - **Environment:** Production(필수), Preview 원하면 체크
5. **Save** 후 **Deployments** 탭에서 최신 배포 **Redeploy** (또는 새로 푸시해서 재배포)

> ⚠️ `VITE_APP_PASSWORD`를 넣지 않으면 "관리자에게 비밀번호 설정을 요청하세요"라고 나옵니다. 반드시 Vercel에서 설정 후 재배포해야 합니다.

## Vercel 배포 여부

- 이 프로젝트에는 `vercel.json`이 있어 **Vercel로 배포 가능**한 상태입니다.
- **실제로 배포가 됐는지**는 다음으로 확인하세요:
  - Vercel 대시보드에서 해당 프로젝트가 있고, **Deployments**에 성공한 배포가 있는지
  - 주소 **https://star-eva-hr-dashboard.vercel.app/** (또는 본인 도메인) 접속 시 로그인 화면이 나오는지

Git 저장소를 Vercel에 연결한 뒤 푸시할 때마다 자동 배포됩니다. 아직 연결 안 했다면: Vercel → **Add New Project** → GitHub에서 이 저장소 선택 → **Root Directory**를 `hr-dashboard-deploy`로 설정 후 Deploy.

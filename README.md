# STAR EVA - HR Dashboard

Vite + React 기반 HR 대시보드 프로젝트입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

## GitHub에 올리기 (최초 1회)

1. [GitHub 새 저장소 만들기](https://github.com/new) 이동
2. **Repository name**: `star-eva-hr-dashboard` (또는 원하는 이름)
3. **Public** 선택, README/ .gitignore 추가하지 **않고** Create
4. 터미널에서 (저장소 이름을 바꿨다면 아래 URL도 동일하게 수정):

```bash
git remote set-url origin https://github.com/hongik423/star-eva-hr-dashboard.git
git push -u origin main
```

## Vercel 배포

- **GitHub 연동**: [Vercel](https://vercel.com) → New Project → GitHub에서 `star-eva-hr-dashboard` 선택 후 Deploy
- **로컬 배포**: `npx vercel` 실행 후 안내에 따라 진행

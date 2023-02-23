{{#isString swagger.title}} # {{{this}}} {{/isString}}
{{#isString swagger.description}} ## {{{this}}} {{/isString}}
<br/>

### 초기 패키지 설치 및 Prettier 적용(Installing initial packages and applying Pretier)

```sh
npm install && npm run format
```

<br/>

### Swagger Doc

- http://localhost:3000/api-docs/

<br/>

### local build & running

```sh
npm run start:local
```

### deploy

```sh
npm run build & npm run start
```

### unit test

```sh
npm run test
```

<br/>

## src skeleton

```sh
src
├── /config
│   └── .env.local
├── /controller
│   └── ...
├── /dto
│   └── ...
├── /module
│   └── ...
├── /service
│   └── ...
├── /utils
│   └── all-exception.filter.ts
│   └── common-exception.filter.ts
│   └── common-exception.ts
│   └── constant.ts
│   └── swagger.ts
├── app.module.ts
├── main.ts
```

- src/config : 프로젝트 환경변수 설정(Set Project Environment Variables)
- src/controller : 클라이언트 요청/응답 처리(Client Request/Response Processing)
- src/dto : 클라이언트 요청/응답 DTO(Tata Transfer Object) (Client Request/Response DTO(Tata Transfer Object))
- src/module : 서비스 모듈 (Service Module)
- src/service: 비즈니스 로직 (Business Logic)
- src/utils : 공통 함수 (Common Features)
- src/app.module.ts : Root 모듈 (Root Module)
- src/main.ts : 프로젝트 실행 (Running a project)

## git commit style

- type
  - feat : 새로운 기능 추가(add new features)
  - fix : 버그 수정(bug fix)
  - docs : 문서의 수정(doc fix)
  - refactor : 코드를 리펙토링 (refectoring code)
  - test : Test 관련한 코드의 추가, 수정(add or modify test-related code)
  - chore : 코드의 수정 없이 설정을 변경 (change settings without code modification)

```s
작성 방법 - feat: 로그인 기능 추가 (How to create - feat: add login function )
```

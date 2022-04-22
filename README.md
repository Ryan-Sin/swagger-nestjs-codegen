# Swagger Codegen(Nest.js)

## 개요

```text
Swagger Yaml 파일 정보를 기반으로 Nest.js 프레임워크 프로젝트를 만들어주는 코드 자동 생성 도구
```

`Yaml 작성 방법은 링크를 통해 학습하시는 걸 추천드립니다.` [Swagger](https://any-ting.tistory.com/37)

<br/>
<br/>

## 소스 설치

```bash
# npm
$ npm install -g @newko/swagger-nestjs-codegen

# yarn
$ yarn global add @newko/swagger-nestjs-codegen
```

<br/>

## 명령어(CLI)

```bash
$ codegen -s [swagger.yaml 파일 경로] -p [프로젝트 이름]
```

<br/>

## 예시(Examples)

```bash
# 1. 프로젝트 디렉토리 생성 방식
$ codegen -s swagger.yaml -p swagger

# 2. 현재 디렉토리 기반으로 프로젝트 생성 방식
$ codegen -s swagger.yaml -p .

#옵션
options :
  -s, --swagger_file <swagger_file> (참조할 Swagger Yaml 파일)
  -p, --procjet_name <procjet_name> (새롭게 생성할 프로젝트 이름)
```

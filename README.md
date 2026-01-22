# 2025 Fall Wheel Seminar Final Assignment

휠 세미나 최종 과제에서는 휠 세미나 전반에서 배운
지식들을 활용하여 서비스를 배포하게 됩니다.

## Seminar Curriculum

### 기초 필수
- **WHL101** - Welcome to the Wheel [오프라인]
- **WHL102** - Wheel Structure [오프라인]

### 전공 필수
- **WHL201** - Linux [온라인]
- **WHL202** - Docker (with Compose) [온라인]
- **WHL203** - Nginx & SSL [오프라인]
- **WHL204** - Security [오프라인]
- **WHL205** - Virtualization & Proxmox [온라인]

---

# Requisites
이 과제에서는 다음과 같은 기능들을 구현하게 됩니다.

- [ ] **[`app.js`](./application/app.js)를 작동시키는 `Dockerfile`을 작성**
    - WHL202 - Docker
- [ ] **[`app.js`](./application/app.js)와 mysql 데이터베이스로 구성된 `docker-compose.yml` 작성**
    - WHL202 - Docker
- [ ] **서버에 배포된 서비스를 `HTTPS`로 접속할 수 있도록 `ssl` 인증서 발급**
    - WHL203 - Nginx & SSL

# Guide
최종 과제를 구현하기 위한 가이드입니다. 
어디까지나 가이드일 뿐이며, 꼭 **가이드에 나온 방법, 툴을 사용하지 않아도 무방**합니다. 

## 1. `Dockerfile` 작성
이 과제에서는 [`app.js`](./application/app.js)를 작동시키는 `Dockerfile`을 작성해야 합니다.

베이스 이미지로는 [`node:lts`](https://hub.docker.com/layers/library/node/node:lts) 이미지, 또는 이를 베이스로 하는 이미지를 사용하면 됩니다.

### Dockerfile 작성 가이드
`Dockerfile`을 작성할 때 다음 순서와 역할을 고려해야 합니다:

1. **작업 디렉토리 설정**
   - 컨테이너 내부에서 애플리케이션이 실행될 디렉토리를 설정합니다.
   - 이후 모든 명령어는 이 디렉토리에서 실행됩니다.

2. **의존성 파일 복사 및 설치**
   - `package.json`과 `package-lock.json` 파일을 먼저 복사합니다.
   - 이렇게 하면 의존성이 변경되지 않은 경우 Docker 레이어 캐싱을 활용할 수 있습니다.
   - `npm install`을 실행하여 Node.js 패키지 의존성을 설치합니다.

3. **Prisma 스키마 복사 및 Client 생성**
   - Prisma 스키마 파일(`schema.prisma`)을 복사합니다.
   - `npx prisma generate`를 실행하여 Prisma Client를 생성합니다.

4. **애플리케이션 파일 복사**
   - 나머지 애플리케이션 파일들을 컨테이너로 복사합니다.
   - 이 단계는 의존성과 Prisma Client가 준비된 후에 수행합니다.

5. **컨테이너 시작 명령어 설정**
   - 컨테이너가 시작될 때 실행될 명령어를 지정합니다.
   - 데이터베이스 스키마를 동기화하고(`prisma db push`) 서버를 시작(`npm start`)해야 합니다.
   - 두 명령어를 순차적으로 실행하도록 설정합니다.

## 2. `docker-compose.yml` 작성
[`application/docker-compose.yml`](./application/docker-compose.yml) 파일을 작성하여 서버와 데이터베이스 컨테이너를 구성해야 합니다.

### 서버 컨테이너
위에서 작성한 `Dockerfile`을 이용하여 서버 컨테이너를 구성합니다. 
이때 각각의 컨테이너에 필요한 환경 변수들을 설정해 주어야 합니다. 

#### 환경 변수
애플리케이션 작동을 위해 필요한 환경 변수를 설정해야 합니다. (도메인, 데이터베이스 접속 정보 등)
자세한 내용은 [`.env.example`](./application/.env.example) 파일을 참고하세요.

### 데이터베이스

이 레포지토리에서는 `MySQL`을 사용합니다.
[`mysql` 이미지](https://hub.docker.com/layers/library/mysql/latest)를 사용하여 데이터베이스 컨테이너를 구성합니다.

데이터베이스 사용자와 비밀번호는 환경 변수를 통해 설정할 수 있습니다.

### 리버스 프록시 (Nginx) 기반 설정

Nginx는 Docker가 아닌 호스트에 직접 설치합니다. [공식 nginx.org 설치 문서](https://nginx.org/en/linux_packages.html#Ubuntu)를 참고하여 최신 버전을 설치하세요.

#### 1. Nginx 기본 환경 구성
공식 패키지로 설치한 경우 가상 호스트(Virtual Host) 관리를 위한 디렉토리가 기본적으로 없을 수 있습니다.
1.  **디렉토리 생성**: `sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled`
2.  **nginx.conf 수정**: `/etc/nginx/nginx.conf`의 `http` 블록 내에 `include /etc/nginx/sites-enabled/*;`를 추가합니다.

#### 2. SSL 인증서 발급 (HTTP-01 챌린지)
`letsencrypt` 인증서를 발급받기 위해 먼저 임시 HTTP 설정을 활성화해야 합니다.

1.  **HTTP-01 챌린지용 설정 연결**: 제공된 [`http.conf`](./nginx/sites-available/http.conf)를 참고하여 `/etc/nginx/sites-available/`에 파일을 생성하고, `sites-enabled`에 심볼릭 링크를 연결합니다.
2.  **챌린지 디렉토리 준비**: `sudo mkdir -p /var/www/certbot`
3.  **인증서 발급**: 제공된 [`certbot-webroot.sh`](./certbot-webroot.sh) 스크립트를 사용하여 인증서를 발급받습니다. 도메인은 도전자마다 제공된 도메인을 사용하세요.
    ```bash
    sudo bash certbot-webroot.sh mock.domain.sparcs.net
    ```

#### 3. 최종 가상 호스트 설정 (HTTPS & Reverse Proxy)
인증서 발급이 완료되면, 설정을 수정하여 HTTPS(443)를 지원하고 서버 애플리케이션으로 요청을 전달하도록 구성합니다.

- **요구사항**:
    - 443번 포트를 경청(listen ssl)합니다.
    - 발급된 인증서와 키 경로를 정확히 지정합니다.
    - 모든 요청을 서버 애플리케이션(컨테이너 내부 포트)으로 전달(proxy_pass)하도록 구성합니다.
    - 호스트 정보와 IP 정보를 포함한 필수 프록시 헤더를 설정합니다.

설정 수정 후 `nginx -t`로 검증하고 서비스를 재시작(`nginx -s reload`)하여 적용합니다.

## 4. 실행 방법

### 환경 변수 설정
먼저 `application` 디렉토리로 이동한 후 `.env.example` 파일을 복사하여 `.env` 파일을 생성하세요:

```bash
cd application
cp .env.example .env
```

필요에 따라 `.env` 파일의 환경 변수 값을 수정할 수 있습니다.

# API Endpoints

이 서버는 다음과 같은 API 엔드포인트를 제공합니다:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/db/status` | 데이터베이스 연결 상태 확인 |


# Submission

과제의 내용이 모두 구현된 **GitHub Repository**와 배포된 **서비스의 링크**를 제출해 주세요.


# Remarks

휠 세미나에서 배운 내용을 모두 활용하는 과제인 만큼, 과제의 난이도가 기존 과제들보다 훨씬 높을 것이라 생각합니다. 

휠 세미나를 통과하기 위한 장벽이라기 보다는, 공부한 내용을 실제로 적용해 보고 이를 조합하여 하나의 서비스를 배포하는 데에 중점을 두었으므로 
과제를 하다 막히거나 궁금한 부분이 있다면 자유롭게 질문해 주세요!

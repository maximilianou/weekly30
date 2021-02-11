# weekly30

---
## Step 1 - start project from phone.

- Termux
- install node
- create typescript project

### Learning github Action ( and Typescript )

- https://www.youtube.com/watch?v=R8_veQiYBjI

---
## Step 2 - back in my computer

- https://basarat.gitbook.io/typescript/intro-1/jest
- https://kulshekhar.github.io/ts-jest/
- https://github.com/actions
- https://github.com/actions/checkout (written in Typescript)

- https://docs.docker.com/develop/develop-images/multistage-build/

---
## Step 3 - Typescript Project
- Start Typescript Project Base
```
mkdir api
cd api
npm i -D @types/jest ts-jest ts-node typescript
```

- api/index.ts
```ts
	console.log(`Ok!!`);
```

- api/tsconfig.json
```json
...
	   "outDir": "./lib",
     "rootDir": "./src",
...
```

- api/package.json
```json
{ 
  ...
  "scripts": {
    "build": "./node_modules/.bin/tsc",
    "run": "./node_modules/.bin/ts-node ./src/index.ts",
    "start": "node ./lib/index.js",
    "test": "echo 'TODO: TDD .. '",
    "ci": "echo 'TODO:Continuous Integracion .. ' "
  },
  ... 
}
```

---
## Step 4 - Docker Image
- api/Dockerfile
```dockerfile
FROM node:alpine AS builder
WORKDIR /usr/src/app
RUN  chown node:node .
USER node
COPY package*.json ./
RUN  npm ci
COPY tsconfig*.json ./
COPY src src
RUN  npm run build

FROM node:alpine
ENV NODE_ENV=production
RUN apk add --no-cache tini
WORKDIR /usr/src/app
RUN chown node:node .
USER node
COPY --chown=node:node package*.json ./
RUN npm install
COPY --from=builder /usr/src/app/lib/ lib/
EXPOSE 3000
ENTRYPOINT [ "/sbin/tini","--", "node", "lib/index.js" ]
```

```
$ docker build . -t ghcr.io/maximilianou/api30:latest
...
Successfully built 3b014292169d
Successfully tagged ghcr.io/api:latest
```

```
$ docker run ghcr.io/maximilianou/api30:latest
Ok!!
```
---
## Step 5 - publish docker image
- https://docs.github.com/en/packages/guides/pushing-and-pulling-docker-images

- Docker Login Github Container Registry 
```
$ echo $GITHUB_TOKEN | docker login ghcr.io -u maximilianou@gmail.com --password-stdin
Login Succeeded
```

$ docker push ghcr.io/OWNER/IMAGE_NAME:latest
$ docker push ghcr.io/OWNER/IMAGE-NAME:2.5

- docker image push to ghcr.io github registry
```
$ docker push ghcr.io/maximilianou/api30:latest
The push refers to repository [ghcr.io/maximilianou/api30]
dd52d5225c89: Pushed 
e7f8d710e301: Pushed 
3deaf6e03bca: Pushed 
de7256c91d7c: Pushed 
d794d3f812e6: Pushed 
70c8cc8ade90: Pushed 
76d84199b92a: Pushed 
34be7c7482f8: Pushed 
c522df4133ef: Pushed 
0fcbbeeeb0d7: Pushed 
latest: digest: sha256:08b15866ec8b2bbae5d812758acfd3708eeace725e9fd638f0d8422647e0e8cf size: 2407
```
- docker image pull from ghcr.io github registry
```
docker run ghcr.io/maximilianou/api30
Digest: sha256:08b15866ec8b2bbae5d812758acfd3708eeace725e9fd638f0d8422647e0e8cf
Status: Downloaded newer image for ghcr.io/maximilianou/api30:latest
Ok!!
```

---
## Step 6 - Github Action looking for CI
- .github/workflows/ci.yml 
```yml
name: CI Typescript Node.js 
# https://docs.github.com/en/actions
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [14.x]
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v1
      with:
        node-version: ${{ matrix.node-version }}
    - run: cd api && npm ci
    - run: cd api && npm run build --if-present
    - run: cd api && npm test
#  publish:
#    needs: build
```


---
## Step 7 - Github Action Push Image to GHCR Github Container Registry

### Looking for Github Actions Pre Build
- https://github.com/marketplace?type=actions
- https://docs.github.com/en/actions/learn-github-actions


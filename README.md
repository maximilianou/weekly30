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
- api/Dockerfile.ci
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
RUN npm install --production
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

- Using existing docker build push action 


- https://github.com/marketplace/actions/docker-build-push-action

Support:
- Docker Hub
- Google Container Registry (GCR)
- AWS Elastic Container Registry (ECR)
- GitHub Docker Registry

### OK OK OK, I try with ghcr.io but, this happend, so i will use dockerhub
I can push over command line, but I can't over github action, I will see this later.
```
denied: failed_precondition: Improved container support has not been enabled for 'github-actions'. Learn more: https://docs.github.com/packages/getting-started-with-github-container-registry/enabling-improved-container-support
Error: Command failed: docker push ghcr.io/maximilianou/api30ci:v1
```

---
## Step 8 - Github Action Push Image to Docker Hub
- github repository -> Settings -> Secret -> DOCKER_USERNAME, DOCKER_PASSWORD

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
    - name: Build and Push Docker Image
      uses: mr-smithers-excellent/docker-build-push@v5
      with:
        image: maximilianou/api30ci
        tags: v1, latest
        dockerfile: api/Dockerfile.ci
        directory: api
        registry: docker.io
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
#        registry: ghcr.io
#        username: ${{ github.actor }}
#        password: ${{ secrets.GITHUB_TOKEN }} 
```

- Result in Github Action Log page.
```
latest: digest: sha256:b420826a74b982ae5e760db22bd8236610b0da5b83300aadae9e5d00d55999c1 size: 2407
Docker image docker.io/***/api30ci:v1 pushed to registry
```

- Result taken from dockerhub
```
$ docker run maximilianou/api30ci
Unable to find image 'maximilianou/api30ci:latest' locally
latest: Pulling from maximilianou/api30ci
0a6724ff3fcd: Already exists 
...
b29fb277ac54: Pull complete 
Digest: sha256:4afac743ad2f417867a4c51ccd8d7da1d227477a7d88e3e3d7da00c7bf265581
Status: Downloaded newer image for maximilianou/api30ci:latest
Ok!!
```

---
## Step 9 - Deploy, Starting, let's go .. Typescript, React, Kubernetes


```
npm install -g create-react-app

npx create-react-app ui --template typescript
cd ui
npm i react-query styled-components
npm i -D @material-ui/core @material-ui/icons @types/styled-components
npm i -D serve
```
- ui/package.json
```json
{
  "name": "ui",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^17.0.1",
    "react-dom": "^17.0.1",
    "react-query": "^3.8.3",
    "react-scripts": "4.0.2",
    "styled-components": "^5.2.1",
    "web-vitals": "^1.1.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "html": "node ./node_modules/serve/bin/serve.js -s build",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@material-ui/core": "^4.11.3",
    "@material-ui/icons": "^4.11.2",
    "@testing-library/jest-dom": "^5.11.9",
    "@testing-library/react": "^11.2.5",
    "@testing-library/user-event": "^12.7.0",
    "@types/jest": "^26.0.20",
    "@types/node": "^12.19.16",
    "@types/react": "^17.0.1",
    "@types/react-dom": "^17.0.0",
    "@types/styled-components": "^5.1.7",
    "serve": "^11.3.2",
    "typescript": "^4.1.5"
  }
}
```

- ui/src/index.tsx
```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
ReactDOM.render( <App />, document.querySelector('#root'));
```

- ui/src/App.tsx
```tsx
const App = () => {
  return (
    <div className="App">
      <p>Strarting..</p>
      <p>Typescript, React, Nodejs, CI Github Action, Docker Hub, Kubernetes.</p> 
      <p>Jest, Cypress, MongoDB, Redis, Postgres, GraphQL.</p> 
      <p>100% Coverage</p> 
      <p>Weekly Release, Please!!</p>
    </div>
  );
}
export default App;
```

- ui/src/App.test.tsx
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Weekly Release, Please!!', () => {
  render(<App />);
  const linkElement = screen.getByText(/Weekly Release, Please!!/i);
  expect(linkElement).toBeInTheDocument();
});
```

---
## Step 10 - Deploy.

- Login into Docker Hub, with password
```
$cat ~/dockerhub.pwd | docker login -u maximilianou --password-stdin 

Login Succeeded
```

- This have to be the Secret in Kubernetes, to access images in dockerhub
```
$ cat ~/.docker/config.json 
{
	"auths": {
		"docker.pkg.github.com": {
			"auth": "b......"
		},
		"ghcr.io": {
			"auth": "b....."
		},
		"https://index.docker.io/v1/": {
			"auth": "b....."
		}
	}
}
```

- Minikube - Kubernetes Local Machine
```
$ minikube ssh
docker@minikube:~$ pwd
/home/docker
docker@minikube:~$ exit
logout
```

- Minikube - Kubernentes login in DockerHub
```
$ minikube ssh
docker@minikube:~$ cat ~/dockerhub.pwd | docker login -u maximilianou --password-stdin https://index.docker.io/v1/ 

Login Succeeded
```
- Minikube - Kubernetes - Check .docker credentials
```
docker@minikube:~$ ls -a
.  ..  .bash_history  .bash_logout  .bashrc  .docker  .profile  .ssh 

docker@minikube:~$ cat .docker/config.json 
{
	"auths": {
		"https://index.docker.io/v1/": {
			"auth": "b....."
		}
	}
}
```

---
## Step 11 - Docker UI React Image, and Container Running in port 3030.

- ui/package.json
```json
{
  "name": "ui",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^17.0.1",
    "react-dom": "^17.0.1",
    "react-query": "^3.8.3",
    "react-scripts": "4.0.2",
    "styled-components": "^5.2.1",
    "serve": "^11.3.2",
    "web-vitals": "^1.1.0"
  },
  "scripts": {
    "start": "node ./node_modules/react-scripts/bin/react-scripts.js start",
    "build": "node ./node_modules/react-scripts/bin/react-scripts.js build",
    "test":  "node ./node_modules/react-scripts/bin/react-scripts.js test",
    "eject": "node ./node_modules/react-scripts/bin/react-scripts.js eject",
    "html":  "node ./node_modules/serve/bin/serve.js -l 3030 -s build"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@material-ui/core": "^4.11.3",
    "@material-ui/icons": "^4.11.2",
    "@testing-library/jest-dom": "^5.11.9",
    "@testing-library/react": "^11.2.5",
    "@testing-library/user-event": "^12.7.0",
    "@types/jest": "^26.0.20",
    "@types/node": "^12.19.16",
    "@types/react": "^17.0.1",
    "@types/react-dom": "^17.0.0",
    "@types/styled-components": "^5.1.7",
    "typescript": "^4.1.5"
  }
}
```
- dockerignore
```
*
!public/
!src/
!tsconfig.json
!tsconfig.build.json
!package.json
!package-lock.json
```

- ui/Dockerfile.ci
```dockerfile
FROM node:alpine AS builder
WORKDIR /usr/src/app
RUN  chown node:node .
USER node
COPY --chown=node:node package*.json ./
RUN  npm ci
COPY --chown=node:node tsconfig*.json ./
COPY --chown=node:node public public
COPY --chown=node:node src src
RUN  npm run build

FROM node:alpine
ENV NODE_ENV=production
RUN apk add --no-cache tini
WORKDIR /usr/src/app
RUN chown node:node .
USER node
COPY --chown=node:node package*.json ./
RUN npm install --production
COPY --chown=node:node --from=builder /usr/src/app/build/ build/
EXPOSE 3030
ENTRYPOINT [ "/sbin/tini","--", "npm", "run", "html" ]
```

- Check UI React container, running in port 3030
```
$ docker run -p 3030:3030 maximilianou/ui30local:latest
```
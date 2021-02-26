# weekly30

---
- TOC
---
1. **Step 3 - Typescript - Create Project - Nodejs**
1. **Step 4 - Docker Image - Dockerfile - production**
1. **Step 6 - Github Action - CI**
1. **Step 12 - CI - Github Action - Docker Image Push - DockerHub**
1. **Step 15 - CD - Github Action - Docker Hub, Front & Back images**
1. **Step 16 - CD - Configure Deployment Component - AWS Kubernetes DockerHub image**
1. **Step 17 - AWS EKS Kubernetes cluster create/delete (eksctl)**
---


---
## Step 1 - start project from phone. ( I have an iclever keyboard )

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


---
## Step 12 - CI - github action - Docker Image push to DockerHub

- Copy file .docker/config.json to the host
```
:~/projects/weekly30$ scp -i $(minikube ssh-key) docker@$(minikube ip):.docker/config.json .docker/config.json
.docker/config.json: No such file or directory

:~$ scp -i $(minikube ssh-key) docker@$(minikube ip):.docker/config.json .docker/config.json
config.json  
```
- k8s/docker-secret.yml
```yml
apiVersion: v1
kind: Secret
metadata:
  name: my-registry-key
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson:

```

- Create the secrete over the file ~/.docker/config.json
```
:~$ kubectl create secret generic my-registry-key --from-file=.dockerconfigjson=.docker/config.json --type=kubernetes.io/dockerconfigjson
secret/my-registry-key created
```

```
:~/projects/weekly30$ kubectl get secret
NAME                  TYPE                                  DATA   AGE
default-token-rngjz   kubernetes.io/service-account-token   3      9d
my-registry-key       kubernetes.io/dockerconfigjson        1      66s
```

- Check :~/projects/weekly30$ kubectl get secret -o yaml
```yml
apiVersion: v1
items:
- apiVersion: v1
  data:
    ca.crt: LS0................
    namespace: bXktbmFtZXNwYWNl
    token: ZXl.................
  kind: Secret
  metadata:
    annotations:
      kubernetes.io/service-account.name: default
      kubernetes.io/service-account.uid: 4ef7c6a8-84c2-4940-8daf-ce04cc6b92e6
    creationTimestamp: "2021-02-03T14:09:33Z"
    managedFields:
    - apiVersion: v1
      fieldsType: FieldsV1
      fieldsV1:
        f:data:
          .: {}
          f:ca.crt: {}
          f:namespace: {}
          f:token: {}
        f:metadata:
          f:annotations:
            .: {}
            f:kubernetes.io/service-account.name: {}
            f:kubernetes.io/service-account.uid: {}
        f:type: {}
      manager: kube-controller-manager
      operation: Update
      time: "2021-02-03T14:09:33Z"
    name: default-token-rngjz
    namespace: my-namespace
    resourceVersion: "73210"
    uid: 2f3d0ce1-241e-4a95-9f49-13c1796ca0ef
  type: kubernetes.io/service-account-token
- apiVersion: v1
  data:
    .dockerconfigjson: e.........................................g..............
  kind: Secret
  metadata:
    creationTimestamp: "2021-02-12T18:21:51Z"
    managedFields:
    - apiVersion: v1
      fieldsType: FieldsV1
      fieldsV1:
        f:data:
          .: {}
          f:.dockerconfigjson: {}
        f:type: {}
      manager: kubectl-create
      operation: Update
      time: "2021-02-12T18:21:51Z"
    name: my-registry-key
    namespace: my-namespace
    resourceVersion: "558350"
    uid: c0d9a4a2-4fa8-492d-9d8d-b2bd6dd4a28a
  type: kubernetes.io/dockerconfigjson
kind: List
metadata:
  resourceVersion: ""
  selfLink: ""
```

---
## Step 13 - CD - AWS Client install with Docker, aws-cli

- aws cli
```
:~/projects/weekly30$ docker run --rm -it amazon/aws-cli --version
aws-cli/2.1.26 Python/3.7.3 Linux/4.19.0-14-amd64 docker/x86_64.amzn.2 prompt/off
```

- AWS - Access aws s3 from aws cli with credentials
```
:~/projects/weekly30$ docker run --rm -it -v ~/.aws:/root/.aws amazon/aws-cli s3 ls
2021-01-12 17:35:19 cf-templates-63uh8fkzfivz-us-east-2
2021-01-26 13:21:32 serverless-dev-serverlessdeploymentbucket-1uxylfngthz91
```

- AWS - Download aws s3 hello from aws cli over docker
```
:~/projects/weekly30$ docker run --rm -it  -v ~/.aws:/root/.aws -v $(pwd):/aws amazon/aws-cli s3 cp s3://aws-cli-docker-demo/hello .
download: s3://aws-cli-docker-demo/hello to ./hello 

:~/projects/weekly30$ cat hello
Hello from Docker!
```

- AWS - passing environment variables -e
```
:~/projects/weekly30$ docker run --rm -it -v ~/.aws:/root/.aws -e AWS_PROFILE amazon/aws-cli s3 ls
2021-01-12 17:35:19 cf-templates-63uh8fkzfivz-us-east-2
2021-01-26 13:21:32 serverless-dev-serverlessdeploymentbucket-1uxylfngthz91
```

- AWS - configuring aws-cli docker client in linux
- ~/.bashrc
```

- AWS - cli add to local env
...
alias aws='docker run --rm -it -v ~/.aws:/root/.aws -v $(pwd):/aws amazon/aws-cli'

$ . ~/.bashrc

$ aws s3 ls
2021-01-12 17:35:19 cf-templates-63uh8fkzfivz-us-east-2
2021-01-26 13:21:32 serverless-dev-serverlessdeploymentbucket-1uxylfngthz91
```

---
## Step 14 - CI - AWS Secret 

- AWS - Kubectl delete secret
```
:~/projects/weekly30$ kubectl delete secret generic my-registry-key 
secret "my-registry-key" deleted
Error from server (NotFound): secrets "generic" not found
```

- AWS - Kubectl create secret my-registry-key
```
:~/projects/weekly30$ kubectl create secret generic my-registry-key --from-file=.dockerconfigjson=../../.docker/config.json --type=kubernetes.io/dockerconfigjson
secret/my-registry-key created
```

- AWS - ECR - kubectl get aws docker-server
```
:~/projects/weekly30$ aws ecr get-authorization-token
AUTHORIZATIONDATA       Q.....    2021-02-14T04:09:16.253000+00:00        https://620157586684.dkr.ecr.us-east-2.amazonaws.com
```

- AWS - ECR - kubectl get aws user docker-passsword
```
:~/projects/weekly30$ aws ecr get-login-password
ey.....................
```

- AWS - ECR - kubectl secrete *IN One Step*
```
:~/projects/weekly30$ kubectl create secret docker-registry my-registry-key --docker-server=https://620157586684.dkr.ecr.us-east-2.amazonaws.com --docker-username=maximilianou --docker-password=ey..................
secret/my-registry-key created
```

- AWS - ECR - Check kubectl Secret
```
:~/projects/weekly30$ kubectl get secret
NAME                  TYPE                                  DATA   AGE
default-token-rngjz   kubernetes.io/service-account-token   3      10d
my-registry-key       kubernetes.io/dockerconfigjson        1      112s
```

---
## Step 15 - CD - github action to docker hub, front & back images

### UI Docker images
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

- ui/package.json
```
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
    "test":  "node ./node_modules/react-scripts/bin/react-scripts.js test --watchAll=false",
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
### Final Result of Deployment
- Github Action - Push - Result Images in DockerHub
```
$ git push

Docker image docker.io/***/api30ci:v1 pushed to registry
Docker image docker.io/***/ui30ci:v1 pushed to registry
```

---
## Step 16 - CD - Configure Deployment Component - AWS kubernetes

- k8s/myapp30-deployment.yml
```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp30
  labels:
    app: myapp30
spec:
  selector:
    matchLabels:
      app: myapp30
  template:
    metadata:
      labels:
        app: myapp30
    spec:
      containers:
      - name: myapp30
#        image: docker.io/maximilianou/ui30ci
        image: maximilianou/ui30ci:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3030
```

- CD - Create Apply AWS Deployment Service
```
:~/projects/weekly30$ kubectl apply -f k8s/myapp30-deployment.yaml 
deployment.apps/myapp30 created

:~/projects/weekly30$ kubectl get pod
NAME                       READY   STATUS              RESTARTS   AGE
myapp30-554469f485-jpfqk   0/1     ContainerCreating   0          56s
```

- logs pod
```
:~/projects/weekly30$  kubectl logs myapp30-554469f485-jpfqk

> ui@0.1.0 html
> node ./node_modules/serve/bin/serve.js -l 3030 -s build

WARNING: Checking for updates failed (use `--debug` to see full error)
INFO: Accepting connections at http://localhost:3030
```

- Delete Deployment service
```
:~/projects/weekly30$ kubectl delete -f k8s/myapp30-deployment.yaml 
deployment.apps "myapp30" deleted
```

- Add Secret to Deployment Service
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp30
  labels:
    app: myapp30
spec:
  selector:
    matchLabels:
      app: myapp30
  template:
    metadata:
      labels:
        app: myapp30
    spec:
      imagePullSecrets:
        - name: my-registry-key
      containers:
      - name: myapp30
#        image: docker.io/maximilianou/ui30ci
        image: maximilianou/ui30ci:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3030
```

- AWS - DockerHub - Kubernetes Secret is running
```
:~/projects/weekly30$ kubectl apply -f k8s/myapp30-deployment.yaml 
deployment.apps/myapp30 created
:~/projects/weekly30$ kubectl get pod
NAME                      READY   STATUS    RESTARTS   AGE
myapp30-c5f899597-g8q7d   1/1     Running   0          15s
```

- Describe Deployment Pod Situation with Secret
```
:~/projects/weekly30$ kubectl describe pod myapp30-c5f899597-g8q7d
Name:         myapp30-c5f899597-g8q7d
Namespace:    my-namespace
Priority:     0
Node:         minikube/192.168.49.2
Start Time:   Sat, 13 Feb 2021 15:16:58 -0300
Labels:       app=myapp30
              pod-template-hash=c5f899597
Annotations:  <none>
Status:       Running
IP:           172.17.0.7
IPs:
  IP:           172.17.0.7
Controlled By:  ReplicaSet/myapp30-c5f899597
Containers:
  myapp30:
    Container ID:   docker://3c21930bb742335e4e8beef5791df88a27c8008fd691c04a6833519c649b1c6c
    Image:          maximilianou/ui30ci:latest
    Image ID:       docker-pullable://maximilianou/ui30ci@sha256:a5ca7193ef1c9d6a1c33408126eda1e5c1979b067e9002de6bb4406c8a30f43f
    Port:           3030/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Sat, 13 Feb 2021 15:17:02 -0300
    Ready:          True
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from default-token-rngjz (ro)
Conditions:
  Type              Status
  Initialized       True 
  Ready             True 
  ContainersReady   True 
  PodScheduled      True 
Volumes:
  default-token-rngjz:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  default-token-rngjz
    Optional:    false
QoS Class:       BestEffort
Node-Selectors:  <none>
Tolerations:     node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                 node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  3m3s  default-scheduler  Successfully assigned my-namespace/myapp30-c5f899597-g8q7d to minikube
  Normal  Pulling    3m3s  kubelet            Pulling image "maximilianou/ui30ci:latest"
  Normal  Pulled     3m    kubelet            Successfully pulled image "maximilianou/ui30ci:latest" in 2.62013922s
  Normal  Created    3m    kubelet            Created container myapp30
  Normal  Started    3m    kubelet            Started container myapp30
```

### Kubernete: Secret have to be in the same namespace of the Pod

---
## Step 17 - CD - AWS EKS Create Cluster / Delete Cluster kubernetes

- eksctl over docker
```
:~/projects$ docker run weaveworks/eksctl

:~/projects$ docker run weaveworks/eksctl eksctl version
[ℹ]  version.Info{BuiltAt:"", GitCommit:"", GitTag:"0.1.21"}
```

- eksctl over docker, without credentials, failed
```
$ docker run weaveworks/eksctl eksctl create cluster --name cluster30 --version 1.17 --region us-east-2 --nodegroup-name linux-nodes --node-type t2.micro --nodes 2

[✖]  checking AWS STS access – cannot get role ARN for current session: NoCredentialProviders:
```

- eksctl over docker, with AWS & Kubernetes Credentials!
```
:~/projects$ docker run -v $HOME/.aws:/root/.aws -v $HOME/.kube:/root/.kube weaveworks/eksctl eksctl create cluster --name cluster30 --version 1.11 --region us-east-2 --nodegroup-name linux-nodes --node-type t2.micro --nodes 2

[ℹ]  using region us-east-2
[ℹ]  setting availability zones to [us-east-2a us-east-2b us-east-2c]
[ℹ]  subnets for us-east-2a - public:192.168.0.0/19 private:192.168.96.0/19
[ℹ]  subnets for us-east-2b - public:192.168.32.0/19 private:192.168.128.0/19
[ℹ]  subnets for us-east-2c - public:192.168.64.0/19 private:192.168.160.0/19
[ℹ]  nodegroup "linux-nodes" will use "ami-0b10ebfc82e446296" [AmazonLinux2/1.11]
[ℹ]  creating EKS cluster "cluster30" in "us-east-2" region
[ℹ]  will create 2 separate CloudFormation stacks for cluster itself and the initial nodegroup
[ℹ]  if you encounter any issues, check CloudFormation console or try 'eksctl utils describe-stacks --region=us-east-2 --name=cluster30'
[ℹ]  creating cluster stack "eksctl-cluster30-cluster"
...
[✖]  unexpected status "ROLLBACK_IN_PROGRESS" while waiting for CloudFormation stack "eksctl-cluster30-cluster" to reach "CREATE_COMPLETE" status
...
[ℹ]  fetching stack events in attempt to troubleshoot the root cause of the failure
InvalidParameterException; Request ID: cc78a9f8-4eb5-4810-8479-fd1813bd2bb3; Proxy: null)"
...
[ℹ]  1 error(s) occurred and cluster hasn't been created properly, you may wish to check CloudFormation console
[ℹ]  to cleanup resources, run 'eksctl delete cluster --region=us-east-2 --name=cluster30'
...
[✖]  waiting for CloudFormation stack "eksctl-cluster30-cluster" to reach "CREATE_COMPLETE" status: ResourceNotReady: failed waiting for successful resource state
...
[✖]  failed to create cluster "cluster30"

```

```
$ docker run -v $HOME/.aws:/root/.aws -v $HOME/.kube:/root/.kube weaveworks/eksctl eksctl delete cluster --name cluster30
[ℹ]  deleting EKS cluster "cluster30"
[ℹ]  will delete stack "eksctl-cluster30-cluster"
[✔]  the following EKS cluster resource(s) for "cluster30" will be deleted: cluster. If in doubt, check CloudFormation console

```

- AWS
```
:~/projects/weekly30$ cat ~/.aws/credentials 
[default]
aws_access_key_id = A...
aws_secret_access_key = q...

:~/projects/weekly30$ cat ~/.aws/config 
[default]
region = us-east-2
output = text
cli_binary_format=raw-in-base64-out
```

- ecsctl Install binaries locally
```
$ curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp

# mv /tmp/eksctl /usr/local/bin

$ eksctl version
0.38.0

$ kubectl version
Client Version: version.Info{Major:"1", Minor:"20", GitVersion:"v1.20.2", GitCommit:"faecb196815e248d3ecfb03c680a4507229c2a56", GitTreeState:"clean", BuildDate:"2021-01-13T13:28:09Z", GoVersion:"go1.15.5", Compiler:"gc", Platform:"linux/amd64"}
Server Version: version.Info{Major:"1", Minor:"20", GitVersion:"v1.20.2", GitCommit:"faecb196815e248d3ecfb03c680a4507229c2a56", GitTreeState:"clean", BuildDate:"2021-01-13T13:20:00Z", GoVersion:"go1.15.5", Compiler:"gc", Platform:"linux/amd64"}

```

- eksctl Successfull created Cluster! and Nodes!
```
$ eksctl create cluster --name cluster30 --region us-east-2 --nodegroup-name linux-nodejs --node-type t2.micro --nodes 2

2021-02-17 14:54:31 [ℹ]  eksctl version 0.38.0
2021-02-17 14:54:31 [ℹ]  using region us-east-2
2021-02-17 14:54:32 [ℹ]  setting availability zones to [us-east-2c us-east-2b us-east-2a]
2021-02-17 14:54:32 [ℹ]  subnets for us-east-2c - public:192.168.0.0/19 private:192.168.96.0/19
2021-02-17 14:54:32 [ℹ]  subnets for us-east-2b - public:192.168.32.0/19 private:192.168.128.0/19
2021-02-17 14:54:32 [ℹ]  subnets for us-east-2a - public:192.168.64.0/19 private:192.168.160.0/19
2021-02-17 14:54:33 [ℹ]  nodegroup "linux-nodejs" will use "ami-043526cfbcdc14c2c" [AmazonLinux2/1.18]
2021-02-17 14:54:33 [ℹ]  using Kubernetes version 1.18
2021-02-17 14:54:33 [ℹ]  creating EKS cluster "cluster30" in "us-east-2" region with un-managed nodes
2021-02-17 14:54:33 [ℹ]  will create 2 separate CloudFormation stacks for cluster itself and the initial nodegroup
2021-02-17 14:54:33 [ℹ]  if you encounter any issues, check CloudFormation console or try 'eksctl utils describe-stacks --region=us-east-2 --cluster=cluster30'
2021-02-17 14:54:33 [ℹ]  CloudWatch logging will not be enabled for cluster "cluster30" in "us-east-2"
2021-02-17 14:54:33 [ℹ]  you can enable it with 'eksctl utils update-cluster-logging --enable-types={SPECIFY-YOUR-LOG-TYPES-HERE (e.g. all)} --region=us-east-2 --cluster=cluster30'
2021-02-17 14:54:33 [ℹ]  Kubernetes API endpoint access will use default of {publicAccess=true, privateAccess=false} for cluster "cluster30" in "us-east-2"
2021-02-17 14:54:33 [ℹ]  2 sequential tasks: { create cluster control plane "cluster30", 3 sequential sub-tasks: { wait for control plane to become ready, create addons, create nodegroup "linux-nodejs" } }
2021-02-17 14:54:33 [ℹ]  building cluster stack "eksctl-cluster30-cluster"
2021-02-17 14:54:35 [ℹ]  deploying stack "eksctl-cluster30-cluster"
2021-02-17 14:54:35 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:54:54 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:55:10 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:55:29 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:55:48 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:56:07 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:56:26 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:56:47 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:57:06 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:57:24 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:57:41 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:58:00 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:58:17 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:58:38 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:58:55 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:59:12 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:59:29 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 14:59:49 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:00:05 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:00:21 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:00:42 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:01:02 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:01:20 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:01:37 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:01:57 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:02:13 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:02:33 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:02:50 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:03:07 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:03:25 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:03:44 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:04:00 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:04:16 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:04:34 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:04:53 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:05:09 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:05:30 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:05:50 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:06:06 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:06:24 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:06:45 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-cluster"
2021-02-17 15:08:00 [ℹ]  building nodegroup stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:08:00 [ℹ]  --nodes-min=2 was set automatically for nodegroup linux-nodejs
2021-02-17 15:08:00 [ℹ]  --nodes-max=2 was set automatically for nodegroup linux-nodejs
2021-02-17 15:08:02 [ℹ]  deploying stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:08:02 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:08:18 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:08:37 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:08:54 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:09:10 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:09:28 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:09:49 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:10:05 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:10:22 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:10:40 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:10:59 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:11:19 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:11:37 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:11:57 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:12:15 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 15:12:16 [ℹ]  waiting for the control plane availability...
2021-02-17 15:12:16 [✔]  saved kubeconfig as "/home/maximilianou/.kube/config"
2021-02-17 15:12:16 [ℹ]  no tasks
2021-02-17 15:12:16 [✔]  all EKS cluster resources for "cluster30" have been created
2021-02-17 15:12:17 [ℹ]  adding identity "arn:aws:iam::620157586684:role/eksctl-cluster30-nodegroup-linux-NodeInstanceRole-100JGVFTLHZQR" to auth ConfigMap
2021-02-17 15:12:18 [ℹ]  nodegroup "linux-nodejs" has 0 node(s)
2021-02-17 15:12:18 [ℹ]  waiting for at least 2 node(s) to become ready in "linux-nodejs"
2021-02-17 15:12:48 [ℹ]  nodegroup "linux-nodejs" has 2 node(s)
2021-02-17 15:12:48 [ℹ]  node "ip-192-168-4-60.us-east-2.compute.internal" is ready
2021-02-17 15:12:48 [ℹ]  node "ip-192-168-58-49.us-east-2.compute.internal" is ready
2021-02-17 15:12:52 [ℹ]  kubectl command should work with "/home/maximilianou/.kube/config", try 'kubectl get nodes'
2021-02-17 15:12:52 [✔]  EKS cluster "cluster30" in "us-east-2" region is ready
```

```
$ kubectl get nodes
NAME                                          STATUS   ROLES    AGE     VERSION
ip-192-168-4-60.us-east-2.compute.internal    Ready    <none>   2m28s   v1.18.9-eks-d1db3c
ip-192-168-58-49.us-east-2.compute.internal   Ready    <none>   2m28s   v1.18.9-eks-d1db3c
```

- Clean AWS!!! Delete the Kubernetes Cluster.
```
$ eksctl delete cluster --name cluster30

2021-02-17 17:58:54 [ℹ]  eksctl version 0.38.0
2021-02-17 17:58:54 [ℹ]  using region us-east-2
2021-02-17 17:58:54 [ℹ]  deleting EKS cluster "cluster30"
2021-02-17 17:58:57 [ℹ]  deleted 0 Fargate profile(s)
2021-02-17 17:58:58 [✔]  kubeconfig has been updated
2021-02-17 17:58:58 [ℹ]  cleaning up AWS load balancers created by Kubernetes objects of Kind Service or Ingress
2021-02-17 17:59:03 [ℹ]  2 sequential tasks: { delete nodegroup "linux-nodejs", delete cluster control plane "cluster30" [async] }
2021-02-17 17:59:04 [ℹ]  will delete stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 17:59:04 [ℹ]  waiting for stack "eksctl-cluster30-nodegroup-linux-nodejs" to get deleted
2021-02-17 17:59:04 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 17:59:22 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 17:59:38 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 17:59:57 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 18:00:14 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 18:00:30 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 18:00:50 [ℹ]  waiting for CloudFormation stack "eksctl-cluster30-nodegroup-linux-nodejs"
2021-02-17 18:00:52 [ℹ]  will delete stack "eksctl-cluster30-cluster"
2021-02-17 18:00:52 [✔]  all cluster resources were deleted
```

---
## Step 18 - CD - AWS EKS deploy worker nodes kubernetes


---
## Step 19 - CD - AWS EKS from GitHub Action



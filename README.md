# Node.js Development Workflow with Docker

The repository shows how to develop locally and deploy the application as a Docker image for production.

### Local development

```bash
docker-compose up -d
```

### Production bundling

```bash
docker build -t node-docker-workflow .
```


### build dev docker 
docker build -t node_dev --build-arg USER_ID=$(id -u) --build-arg GROUP_ID=$(id -g)  -f Dockerfile.nodejs.dev  .

### use dev docker
cd into /src under node project 
docker run --rm -u $(id -u):$(id -g) -it -p 3000:3000 -p 5671:5671 -v $(pwd):/usr/app/src node_dev

or just run docker-compose in this root of project


### add new package
edit package name and version in package.json file
then build new image  -> ### build dev docker 
then docker-compose up new image
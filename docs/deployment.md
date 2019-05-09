# Deployment

> How to deploy the site to AWS Elastic Beanstalk

1. Build the Reactjs Static Files
2. Deploy with the EB CLI

## 1. Build the Reactjs Static Files

* Navigate to the react directory in the django project.
* Run the build command

```bash
$ npm run build
```

## 2. Deploy with the EB CLI

* Run the deploy command

```bash
$ eb deploy
```

### Node Express template project

This project is based on a GitLab [Project Template](https://docs.gitlab.com/ee/gitlab-basics/create-project.html).

Improvements can be proposed in the [original project](https://gitlab.com/gitlab-org/project-templates/express).

### Contributors

| Numéro Etudiant | nom            | email                              |
|-----------------|----------------|------------------------------------|
| dj180840        | Julien Deveaux | julien.deveaux@etu.univ-lehavre.fr |
| dd180642        | Dimitri Dubois | dimitri.dubois@etu.univ-lehavre.fr |

## To start the project
```
$ npm install 
$ npm start
```
The app should be up and running at http://localhost:3000/

## To start the project with docker
```angular2html
$ docker build -t [imageName] .
$ docker run -p [port]:3000 [imageName]
```
The app should be up and running at http://localhost:[port]/
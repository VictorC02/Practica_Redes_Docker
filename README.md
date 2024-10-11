<h2 align="center">Database Status</h3>

---

<p align="center"> This project consists of the deployment of a service composed of several applications running in separate containers using Docker. The service includes a web application, a database and a cache. It will be deployed in two environments: dev and pro. Pro will contain all three services, but dev will only contain the web application and the database (without cache).
    
</p>

## 📝 Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Running Tests](#tests)
- [Built Using](#built_using)
- [Author](#author)

## 🧐 About <a name = "about"></a>

The foundation of this project is to learn how to use Docker to run various services in different isolated containers. We will also learn how to connect the different containers between them, as well as learn how to use docker-compose, which will be the key tool to manage networks, environment variables, ports and volumes, so that all services work correctly.

In the following diagram you can see how the architecture of the services looks like (Docker point of view).

![Diagrama de Arquitectura](/images/arquitectura.PNG)

## 🏁 Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need have installed docker in your device.

If you have Windows, I recommend to install WSL and install from there Docker with the following command

```
apt install docker
```
I recommend to use Microsoft Visual Studio Code and Docker Desktop.
### Setup and Run Services

Here are the steps to setup your environment:

* Download or clone the project on Github
* Open a new terminal on VSC, preferably on WSL Ubuntu
* Enter the following command to build and run the containers
```
docker-compose -f compose.dev.yaml up --build
```
```
docker-compose -f compose.pro.yaml up --build
```

Now the containers and the services are running.To see the webapp you need to open your browser and search the following url:

```
http://localhost:3000
```
Now you can see the webapp and the information about the database and the cache (in pro environment).

If you want to stop the services you need to press Ctrl+C or if you want to remove and clear all the containers, you need to enter the following command:
```
docker-compose -f compose.dev.yaml down
```
```
docker-compose -f compose.pro.yaml down
```
If you want to only stop one service you can do it from the docker desktop containers tab or if you want to do it with console commands, just enter the following command:
```
docker stop <container_name_or_id>
```
Then you will see in the webapp, in case you didn't stop it, that the database/cache is disconnected, and shows you an error.

## 🔧 Running Tests <a name = "tests"></a>



### Cache is only accessible in production environment

To test if cache can be access or is running on development environment, you have to follow the following steps:
* Execute the docker-compose development file ("docker-compose -f compose.dev.yaml up --build")
* Search in web browser the url: "http://localhost:3000"
* In the webapp is shown a message that says "Error: Redis no disponible"
![Redis No Disponible](/images/redis_no_disponible.PNG)
* Go to Docker Desktop and watch that redis is not running
![Redis Container Off](/images/docker_redis_off.PNG)


To test if cache can be access or is running on production environment, you have to follow the following steps:
* Execute the docker-compose production file ("docker-compose -f compose.pro.yaml up --build")
* Search in web browser the url: "http://localhost:3000"
* In the webapp in the lower side u can see if cache has any data
    * If has no data, u can enter some values accessing directly to it using the following command:
```
docker exec -it <container_name_or_id> redis-cli
```
```
SET "KEY" "VALUE"
```
* Then if you refresh the page, the new values will be shown in a table 

### Actions with Database and Cache

To test if you can insert some values or delete some values to database you have to follow the next steps:
* Execute the docker-compose file (Development or Production)
* Search in web browser the url: "http://localhost:3000"
* In the webapp there are some buttons that allow you to add and delete values in the database
    * To add a value, you have to fit the values and press "Agregar"
    ![Añadir Elemento](/images/Añadir%20Elemento.PNG)
    * To delete a value, press in the button "Eliminar"
    ![Eliminar Elemento](/images/eleiminar.PNG)
* Instantly the web will refresh and will show the new values on the database

To test if you can see all values of the cache you have to follow the next steps:
* Execute the docker-compose file (Production)
* Search in web browser the url: "http://localhost:3000"
* In the lower side of the webapp it is shown all values of the cache
    * If there's no values and you want to insert someone to see it on the webapp, you can follow the next steps:
    ![Redis No Values](/images/no%20redis.PNG)
        * Access to redis cli (docker exec -it <container_of_redis> redis-cli)
        * Insert new values (SET "KEY" "VALUE")
        * Refresh webapp
    ![Redis Values](/images/redis_values.PNG)

### Ensure Data Persistence

To test that the data of database persist, you have to follow the next steps:
* Execute the docker-compose file (Development or Production)
* Search in web browser the url: "http://localhost:3000"
* Ensure that database is connected
* Stop and remove the container (docker-compose -f compose.pro/dev.yaml down)
* Execute the same docker-compose file
* Ensure that the values shown are the same that in the previous execution.

## ⛏️ Built Using <a name = "built_using"></a>

- [PostgresSQL](https://www.postgresql.or) - Database
- [Express](https://expressjs.com/) - Server Framework
- [Redis](https://redis.io/) - Cache Database
- [NodeJs](https://nodejs.org/en/) - Server Environment
- [Docker](https://www.docker.com/) - Containers


## ✍️ Author <a name = "authors"></a>

- [@VictorC02](https://github.com/VictorC02) 


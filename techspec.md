# What even is happening?

I don't even know how my own website works sometimes, so I'll try 
to keep track of some of the technical details here.


### Libraries & Tech

* **Python 3.7** and **Django** backend
* **React** Frontend
    * The page is initially served by Django, but react then renders
    the UI.
* **django-rest-framework**
    * used to serialize models into JSON
    * makes fiddling with endpoints nicer because it has a built in UI


# React + Django

Serving a website through **Django** rendered with **React** is not as straightforward 
as just throwing some react files into the Django project.

Additionally, in development, **Django** needs to serve different react files than in
production.  Technically, you don't *have* to tell Django to serve different files,
but you will have to `npm run build` your **React** project every time you make a 
change to your **React** files.

Here's how I have **Django** "intelligently" serving the build files.

### 1. Custom Django Command
path : `lolsite/management/commands/rundev.py`

Allows us to run `python manage.py rundev` in our project folder

> What does it do?

1. Opens a separate terminal and runs `npm run start`
    * This tells npm to serve our react development files on localhost:3000
2. Runs `python manage.py runserver`

Sets `REACT_DEV = TRUE` in our **Django** settings.  This is how **Django** knows
whether or not to serve our **React** Build or Development files.

### 2. Custom Context Processor

path : `lolsite/context_processors.py`

function : `react_data_processor(request)`

> What does it do?

1. Basically...
```python
if REACT_DEV == True:
    # serve react DEVELOPMENT files
else:
    # serve react BUILD files
```

# Summoner Page

> When searching for a summoner, several things happen very quickly.

Different things will happen based on some conditions.

> if, in this browser tab session, **this is the first time the summoner was looked up**.

* send request to django
* django makes an API call to Riot for data on the summoner
* Summoner model is updated or created
* A multithreaded pool requests the most recent 10 games
* Every participant is imported as a Summoner if their summoner_id is not already
in one of the Summoner models
* All match data is imported into their respective models.
* The searched summoner's rank positions are queried and saved to a RankCheckpoint model
    * These are saved **every time** django notices that their rank position changes so we can keep track of
    the summoner's progress.

> else - **the summoner was already searched for in this session**

* Load summoner data from the react data store
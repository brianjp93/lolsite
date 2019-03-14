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

### Custom Django Command - `python manage.py rundev`
**path** : `lolsite/management/commands/rundev.py`

Allows us to run `python manage.py rundev` in our project folder

> What does it do?

1. Opens a separate terminal and runs `npm run start`
    * This tells npm to serve our react development files on localhost:3000
2. Runs `python manage.py runserver`

Sets `REACT_DEV = TRUE` in our **Django** settings.  This is how **Django** knows
whether or not to serve our **React** Build or Development files.

### Custom Context Processor

**path** : `lolsite/context_processors.py`

**function** : `react_data_processor(request)`

> What does it do?

1. Basically...
```python
if REACT_DEV == True:
    # serve react DEVELOPMENT files
else:
    # serve react BUILD files
```
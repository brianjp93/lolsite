
[![CircleCI](https://circleci.com/gh/brianjp93/lolsite.svg?style=svg)](https://circleci.com/gh/brianjp93/lolsite)

# Local Setup

1. Download [Postgres](https://www.postgresql.org/).
2. Create a Database in PGAdmin4
3. Add credentials to your environment variables
    * LOLSITE-NAME
    * LOLSITE-USER
    * LOLSITE-PASS
    * LOLSITE-HOST
    * LOLSITE-PORT
4. Create a virtual env and install python packages via requirements.txt
    * create virtual env
    * `pip install -r requirements`
5. Install react packages
    * install [nodejs](https://nodejs.org/en/) if necessary so that we have access to npm.
    * `cd react`
    * `/react >> npm install`
6. Run Database Migrations 
    * `python manage.py migrate`
7. Create superuser
    * `python manage.py createsuperuser`
    * follow prompt
8. Run dev server
    * `python manage.py rundev`
        * this call will automatically run the react server, and tell django to use React's development files instead of the build files.
        * you may have to `control+c` out of the rundev command, and rerun it after the react server is up.
    * if this doesn't work, we can run the two servers manually
        * `python manage.py rundev`
        * then in a new command prompt, cd into `/react`
        * start react server - `npm start`
9. Set our API key
    * Set up a developer account at the [riot dev site](https://developer.riotgames.com/)
    * generate a development api key
    * go to [http://localhost:8000/admin](http://localhost:8000/admin)
        * Find `data > Ritos`
        * Create new Rito
        * paste api key into the field and save (You'll have to edit this model every time you generate a new key - don't create new model)
10. Import patch data
    * in a new command prompt, in the base directory start a django shell
        * `python manage.py shell`
        * in the prompt, we can import all data for patch `9.5` like so...

```python
>>> from data import tasks as dt
>>> dt.import_all('9.5.1', language='en_US')

```

11. The site should now be accessible.  -yay


### Run Task Queue

Periodic tasks will be run using SQS on AWS, and redis/celery locally.  To run the local task queue, we need to run a redis-server, and also boot up a worker.

> Running the task queue is unecessary for now.

1. Start redis-server
    * Find redis on your computer (install if necessary), and run the redis-server
2. Boot up a worker node
    * In the `lolsite` project directory, run `celery worker -A lolsite -l info`
    * note that this will have to be manually restarted if changes are made to the project.


# Other Technical Information

Take a look at [techspec.md](techspec.md) for more information on how the site is ticking.

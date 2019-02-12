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
    * if this doesn't work, we can run the two servers manually
        * `python manage.py runserver`
        * change to react directory - `cd react`
        * start react server - `npm start`

### Run Task Queue

Periodic tasks will be run using SQS on AWS, and redis/celery locally.  To run the local task queue, we need to run a redis-server, and also boot up a worker.

1. Start redis-server
    * Find redis on your computer (install if necessary), and run the redis-server
2. Boot up a worker node
    * In the `lolsite` project directory, run `celery worker -A lolsite -l info`
    * note that this will have to be manually restarted if changes are made to the project.
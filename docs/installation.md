# Installation

> Instructions for running the django project locally.


### Docker
1. `cp .docker_env.example .docker_env`
2. `docker-compose up`
3. `docker exec <web container> python manage.py migrate`
4. `docker exec <web container> python manage.py settoken <riot api token>`


### No Docker
1. Download [Postgres](https://www.postgresql.org/).
2. Create a Database for django to access
3. Add credentials to your environment variables or a `.env` file in the project root
    - LOLSITE\_NAME
    - LOLSITE\_USER
    - LOLSITE\_PASS
    - LOLSITE\_HOST
    - LOLSITE\_PORT
    - LOLSITE\_EMAIL\_HOST\_PASSWORD (this is your sendgrid api key)
4. Create a virtual env and install python packages via requirements.txt
    - create virtual env and activate it
    - `pip install -r requirements`
5. Install react packages
    - install [nodejs](https://nodejs.org/en/) if necessary so that we have access to npm.
    - `cd react`
    - `/react >> yarn install`
6. Run Database Migrations
    - `python manage.py migrate`
7. Create superuser
    - `python manage.py createsuperuser`
    - follow prompt
9. Run dev server
    - `python manage.py rundev`
        - this call will automatically run the react server, and tell django to use React's development files instead of the build files.
        - you may have to `control+c` out of the rundev command, and rerun it after the react server is up.
    - if this doesn't work, we can run the two servers manually
        - `python manage.py rundev`
        - then in a new command prompt, cd into `/react`
        - start react server - `yarn start`
10. Set our API key
    - Set up a developer account at the [riot dev site](https://developer.riotgames.com/)
    - generate a development api key
    - go to [http://localhost:8000/admin](http://localhost:8000/admin)
        - Find `data > Ritos`
        - Create new Rito
        - paste api key into the field and save (You'll have to edit this model every time you generate a new key - don't create new model)
11. Install and run redis-server
12. Use custom django command to run celery worker
    - `> python manage.py celery`
        - The custom command will auto reload the celery worker on code changes.
    - If the previous command doesn't work...
        - > . activate <virtual env>
        - > celery -A lolsite worker -l info
13. The site should now be accessible. -yay
14. neovim development with coc
    - run `yarn dlx @yarnpkg/sdks vim` to set up coc to work with yarn properly

[![CircleCI](https://circleci.com/gh/brianjp93/lolsite.svg?style=svg&circle-token=3e958dc79cdd1106457fbc9f5f4015662c447e95)](https://circleci.com/gh/brianjp93/lolsite)

[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

### Some Docs
* [Installation for Local Development](/docs/installation.md)
* [Deployment](/docs/deployment.md)
* [Using an SVM to predict role assignment](/docs/svm.md)
* [Ranking players by their impact](/docs/impact-scores.md)
* [Celery and Async tasks](/docs/celery.md)


# LoL Site

Another league of legends match history and stats site.

# Ideas

* [ ] Add user comments to matches.
    * [ ] Allow any user to comment, but highlight comments from
    users that actually played in the game.
    * [ ] This will most likely welcome post game toxicity, but I think it will be fun, too.
    * [x] Need to add verified user accounts to allow this to become a reality.

- [x] Open summoner page links in a new tab.
- [x] Show winrates with friends
- [x] Show overall played with stats

- [ ] Add multisearch functionality
- [x] carry score
- [x] per game rank average
    * apply player ranks to participant data

- [ ] Add task queue and separate server for consuming periodic and delayed tasks
    * [x] Add task queue
    * [x] Add workers
    * [ ] Add beat
    * this will be a larger addition and will require more money to be spent. I definitely want to do this at some point but not sure when :l

- [ ] Show changes of items and champions over patches.  Diff their data to check for changes.

# Other Technical Information

Take a look at [techspec.md](techspec.md) for more information on how the site is ticking.

# Copyright

I intend to make the code for this project public. In the case that I do, I am not allowing copying of this code but hope that those interested can learn something from seeing it. I also hope that I might get people to make contributions.  We'll see how it goes. I am intentionally not including a license. I do not wish for others to copy this work.

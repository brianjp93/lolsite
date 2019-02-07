import requests


class LolStatus:

    def __init__(self, base):
        self.base = base

    def get(self, region=None):
        '''
        Get League of Legends status for the given shard
        ... wtf is a shard
        '''
        base_url = self.base.base_url[region]
        url = '{}/lol/status/v3/shard-data'.format(base_url)
        r = requests.get(url, headers=self.base.headers)
        return r
import requests


class Masteries:

    def __init__(self, base):
        self.base = base

    def get(self, summoner_id, region=None):
        base_url = self.base.base_url[region]
        url = '{}/lol/platform/v3/masteries/by-summoner/{}'.format(base_url, summoner_id)
        r = requests.get(url, headers=self.base.headers)
        return r
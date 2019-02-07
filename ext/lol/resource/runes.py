import requests


class Runes:
    '''
    RUNES-V3
    https://developer.riotgames.com/api-methods/#runes-v3
    '''

    def __init__(self, base):
        self.base = base

    def get(self, summoner_id, region=None):
        '''
        '''
        base_url = self.base.base_url[region]
        url = '{}/lol/platform/v3/runes/by-summoner/{}'.format(base_url, summoner_id)
        r = requests.get(url, headers=self.base.headers)
        return r
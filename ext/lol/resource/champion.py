import requests

class Champion:
    '''
    CHAMPION-V3
    https://developer.riotgames.com/api-methods/#champion-v3
    '''

    def __init__(self, base):
        self.base = base

    def all(self, region=None):
        '''
        Retrieve all champions
        '''
        base_url = self.base.base_url[region]
        url = '{}/lol/platform/v3/champions'.format(base_url)
        r = requests.get(url, headers=self.base.headers)
        return r

    def get(self, champion_id, region=None):
        '''
        Retrieve champion by ID
        '''
        base_url = self.base.base_url[region]
        url = '{}/lol/platform/v3/champions/{}'.format(base_url, champion_id)
        r = requests.get(url, headers=self.base.headers)
        return r
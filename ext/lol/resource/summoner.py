import requests

class Summoner():
    """
    summoner-V4
    https://developer.riotgames.com/api-methods/#summoner-v4
    """

    def __init__(self, base):
        self.base = base
        self.version = 'v4'

    def get(self, name=None, encrypted_account_id=None, encrypted_summoner_id=None, encrypted_puuid=None, region=None):
        """Get summoner data through one of several identifiers.

        Parameters
        ----------
        name : str
        encrypted_account_id : ID
        encrypted_summoner_id : ID
        encrypted_puuid : ID
        region : str

        Returns
        -------
        Response

        """
        base_url = self.base.base_url[region]
        if name is not None:
            url = f'{base_url}/lol/summoner/{self.version}/summoners/by-name/{name}'
        elif encrypted_account_id is not None:
            url = f'{base_url}/lol/summoner/{self.version}/summoners/by-account/{encrypted_account_id}'.format(base_url, encrypted_account_id)
        elif encrypted_summoner_id is not None:
            url = f'{base_url}/lol/summoner/{self.version}/summoners/{encrypted_summoner_id}'
        else:
            raise Exception('One of [name, encrypted_account_id, encrypted_summoner_id, encrypted_puuid] must be provided')
        r = requests.get(url, headers=self.base.headers)
        return r

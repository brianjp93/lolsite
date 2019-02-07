import requests


class Spectator:
    """
    SPECTATOR-V4
    https://developer.riotgames.com/api-methods/#spectator-v4
    """

    def __init__(self, base):
        self.base = base
        self.version = 'v4'

    def get(self, encrypted_summoner_id, region=None):
        """Get live game data by encrypted summoner ID.

        Parameters
        ----------
        encrypted_summoner_id : ID
        region : str

        Returns
        -------
        requests.Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/spectator/{self.version}/active-games/by-summoner/{encrypted_summoner_id}'
        r = requests.get(url, headers=self.base.headers)
        return r

    def featured(self, region=None):
        """Get featured games.

        Parameters
        ----------
        region : str

        Returns
        -------
        Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/spectator/{self.version}/featured-games'
        r = requests.get(url, headers=self.base.headers)
        return r
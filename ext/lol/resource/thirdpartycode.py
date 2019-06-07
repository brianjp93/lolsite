"""resources/thirdpartycode.py
"""
import requests


class ThirdPartyCode():
    """
    THIRD-PARTY-CODE-V4
    https://developer.riotgames.com/api-methods/#third-party-code-v4
    """

    def __init__(self, base):
        self.base = base
        self.version = 'v4'

    def get(self, encrypted_summoner_id, region=None):
        """Get third party code for summoner.

        Parameters
        ----------
        encrypted_summoner_id : str

        Returns
        -------
        JSON

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/platform/{self.version}/third-party-code/by-summoner/{encrypted_summoner_id}'
        return requests.get(url, headers=self.base.headers)

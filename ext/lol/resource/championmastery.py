import requests


class ChampionMastery:
    """
    CHAMPION-MASTERY-V4
    https://developer.riotgames.com/api-methods/#champion-mastery-v4
    """

    def __init__(self, base):
        self.base = base
        self.version = 'v4'

    def all(self, _id, region=None):
        """Get all champion mastery entries sorted by number of champion points descending,

        parameters
        ----------
        _id : ID
            encrypted summoner ID
        region : str

        Returns
        -------
        JSON Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/champion-mastery/{self.version}/champion-masteries/by-summoner/{_id}'
        r = requests.get(url, headers=self.base.headers)
        return r

    def get(self, summonerid, championid, region=None):
        """Get a champion mastery by summoner ID and champion ID

        Parameters
        ----------
        summonerid : ID
            Encrypted Summoner ID
        championid : ID
        region : str

        Returns
        -------
        JSON Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/champion-mastery/{self.version}/champion-masteries/by-summoner/{summonerid}/by-champion/{championid}'
        r = requests.get(url, headers=self.base.headers)
        return r

    def total(self, summonerid, region=None):
        """Get total champion mastery score
        
        Get a player's total champion mastery score, which is the sum of
            individual champion mastery levels.

        Parameters
        ----------
        summonerid : ID
            Encrypted Summoner ID
        region : str

        Returns
        -------
        JSON Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/champion-mastery/{self.version}/scores/by-summoner/{summonerid}'
        r = requests.get(url, headers=self.base.headers)
        return r
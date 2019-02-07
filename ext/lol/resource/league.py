import requests


class League:
    '''
    LEAGUE-V4
    https://developer.riotgames.com/api-methods/#league-v4
    '''

    def __init__(self, base):
        self.base = base

    def challenger(self, queue, region=None):
        """Get the challenger league for a given queue

        Parameters
        ----------
        queue : str
            enum(
                RANKED_SOLO_5X5,
                RANKED_FLEX_SR,
                RANKED_FLEX_TT
            )
        region : str

        Returns
        -------
        JSON

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/league/{self.version}/challengerleagues/by-queue/{queue}'
        r = requests.get(url, headers=self.base.headers)
        return r

    def grandmaster(self, queue, region=None):
        """Get the GrandMaster league for a given queue.

        Parameters
        ----------
        queue : str
            enum(
                RANKED_SOLO_5X5,
                RANKED_FLEX_SR,
                RANKED_FLEX_TT
            )
        region : str

        Returns
        -------
        JSON Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/league/{self.version}/grandmasterleagues/by-queue/{queue}'
        r = requests.get(url, headers=self.base.headers)
        return r

    def master(self, queue, region=None):
        """Get the Master league for a given queue.

        Parameters
        ----------
        queue : str
            enum(
                RANKED_SOLO_5X5,
                RANKED_FLEX_SR,
                RANKED_FLEX_TT
            )
        region : str

        Returns
        -------
        JSON Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/league/{self.version}/masterleagues/by-queue/{queue}'
        r = requests.get(url, headers=self.base.headers)
        return r

    def league(self, league_id, region=None):
        """Get league by ID

        Parameters
        ----------
        league_id : ID
        region : str

        Returns
        -------
        JSON Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/league/{self.version}/leagues/{league_id}/'
        r = requests.get(url, headers=self.base.headers)
        return r

    def positional_rank_queues(self, region=None):
        """

        Parameters
        ----------
        region : str

        Returns
        -------
        JSON Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/league/{self.version}/positional-rank-queues/'
        r = requests.get(url, headers=self.base.headers)
        return r

    def positions(self, encrypted_summoner_id, region=None):
        """Get league positions in all queues for a given summoner ID

        Parameters
        ----------
        encrypted_summoner_id : ID
        region : str

        Returns
        -------
        JSON Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/league/{self.version}/positions/by-summoner/{encrypted_summoner_id}'
        r = requests.get(url, headers=self.base.headers)
        return r

    def position_list(self, positional_queue, tier, division, position, page, region=None):
        """Get a list of all positions in a queue/tier/division/position.

        Parameters
        ----------
        positional_queue : str
        tier : str
        division : str
        position : str
        page : int
        region : str

        Returns
        -------
        JSON Response

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/league/{self.version}/positions/{positional_queue}/{tier}/{division}/{page}'
        r = requests.get(url, headers=self.base.headers)
        return r

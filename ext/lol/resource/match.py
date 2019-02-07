import requests
from datetime import datetime


class Match:
    """
    MATCH-V4
    https://developer.riotgames.com/api-methods/#match-v4
    """

    def __init__(self, base):
        self.base = base
        self.version = 'v4'

    def get(self, match_id, region=None):
        """Get a match by ID.

        Parameters
        ----------
        match_id : ID

        Returns
        -------
        JSON
            match data

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/match/{self.version}/matches/{match_id}'
        r = requests.get(url, headers=self.base.headers)
        return r

    def filter(self, encrypted_account_id, region=None, **kwargs):
        """Get list of matches by account_id.

        *ORDERED BY NEWEST FIRST*
        
        Parameters
        ----------
        encrypted_account_id : ID
        region : str
        queue : int
        beginTime : datetime
        endTime : datetime
        beginIndex : int
        endIndex : int
        season : int
        champion : int

        Returns
        -------
        JSON
            list of matches

        """
        base_url = self.base.base_url[region]
        valid_kwargs = {
            'queue',        # Set[int]  - Set of queue IDs for which to filtering matchlist.
            'beginTime',    # long      - The begin time to use for filtering matchlist specified as epoch milliseconds.
            'endTime',      # long      - The end time to use for filtering matchlist specified as epoch milliseconds.
            'beginIndex',   # int       - The begin index to use for filtering matchlist.
            'endIndex',     # int       - The end index to use for filtering matchlist.
            'season',       # Set[int]  - Set of season IDs for which to filtering matchlist.
            'champion',     # Set[int]  - Set of champion IDs for which to filtering matchlist.
        }
        params = {}
        for key, value in kwargs.items():
            if key not in valid_kwargs:
                raise Exception('The query parameter {} was provided but is invalid.  Must be one of {}.'.format(key, valid_kwargs))
            else:
                if key in ('beginTime', 'endTime'):
                    try:
                        # convert DateTime to epoch milliseconds
                        value = int(value.timestamp() * 1000)
                    except:
                        pass
                params[key] = value
        url = f'{base_url}/lol/match/{self.version}/matchlists/by-account/{encrypted_account_id}'
        r = requests.get(url, params=params, headers=self.base.headers)
        return r

    def timeline(self, match_id, region=None):
        """Get timeline data for a match.

        Parameters
        ----------
        match_id : ID
        region : str

        Returns
        -------
        JSON
            timeline data

        """
        base_url = self.base.base_url[region]
        url = f'{base_url}/lol/match/{self.version}/timelines/by-match/{match_id}'
        r = requests.get(url, headers=self.base.headers)
        return r

    def tournament_all(self, tournament_code, match_id, region=None):
        """Get matches by tournament codes, or match by tournament code and match id.

        Parameters
        ----------
        tournament_code : str
        match_id : ID
        region : str

        Returns
        -------
        JSON
            match data OR list of match ids

        """
        base_url = self.base.base_url[region]
        if match_id is None:
            url = f'{base_url}/lol/match/{self.version}/matches/by-tournament-code/{tournament_code}/ids'
        else:
            url = f'{base_url}/lol/match/{self.version}/matches/{match_id}/by-tournament-code/{tournament_code}'
        r = requests.get(url, headers=self.base.headers)
        return r
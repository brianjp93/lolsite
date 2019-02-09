import requests


class LolStaticData:
    """
    LOL-STATIC-DATA-V3
    https://developer.riotgames.com/api-methods/#lol-static-data-v3
    """

    def __init__(self, base):
        self.base = 'https://ddragon.leagueoflegends.com'

    def champions(self, name=None, language='en_US', version=''):
        """Get all champions if `name` is not provided.
        """
        if name is None:
            url = f'{self.base}/cdn/{version}/data/{language}/champion.json'
        else:
            url = f'{self.base}/cdn/{version}/data/{language}/champion/{name}.json'
        r = requests.get(url)
        return r

    def items(self, language='en_US', version=''):
        """Get all items.
        """
        url = f'{self.base}/cdn/{version}/data/en_US/item.json'
        return requests.get(url)

    def languages(self):
        """Return supported language strings.
        """
        url = f'{self.base}/cdn/languages.json'
        r = requests.get(url)
        return r

    def masteries(self, version='', language='en_US'):
        """Masteries list.
        """
        url = f'{self.base}/cdn/{version}/data/{language}/mastery.json '
        r = requests.get(url)
        return r

    def profile_icons(self, version='', language='en_US'):
        """Retrieve profile icons.
        """
        url = f'{self.base}/cdn/{version}/data/{language}/profileicon.json'
        r = requests.get(url)
        return r

    def realms(self, region=None):
        """Get realm data.

        Newest version endpoints for different static data.

        Parameters
        ----------
        region : str
            na, euw, jp, kr...

        Returns
        -------
        Response

        """
        url = f'{self.base}/realms/{self.region}.json'
        r = requests.get(url)
        return r

    def runes(self, version='', language='en_US'):
        """Get all rune data.

        Parameters
        ----------
        version : str
        language : str

        Returns
        -------
        Response

        """
        url = f'{self.base}/cdn/{version}/data/{language}/rune.json'
        r = requests.get(url)
        return r

    def runes_reforged(self, version='', language='en_US'):
        """Get new runes data.
        """
        url = f'{self.base}/cdn/{version}/data/{language}/runesReforged.json'
        r = requests.get(url)
        return r


    def summoner_spells(self, version='', language='en_US'):
        """Get summoner spells.
        """
        url = f'{self.base}/cdn/{version}/data/{language}/summoner.json'
        r = requests.get(url)
        return r

    def versions(self):
        """Get all versions.
        """
        url = f'{self.base}/api/versions.json'
        r = requests.get(url)
        return r
import requests

HOST = 'https://api.lolesports.com/api'

def league(slug=None, id=None):
    """Get data about a league.

    Parameters
    ----------
    slug : str
        lcs, lec, lck, lpl...
    id : int

    Returns
    -------
    JSON data

    """
    params = {}
    if slug is not None:
        params['slug'] = slug
    if id is not None:
        params['id'] = id
    url = f"{HOST}/v1/leagues"
    return requests.get(url, params=params)


def highlander_match(tournament_id=None, match_id=None):
    """Get pro data about a match.

    Parameters
    ----------
    tournament_id : str
    match_id : str

    Returns
    -------
    JSON Data

    """
    params = {}
    if tournament_id is not None:
        params['tournamentId'] = tournament_id
    if match_id is not None:
        params['matchId'] = match_id
    url = f"{HOST}/v2/highlanderMatchDetails"
    return requests.get(url, params=params)


def match(game_realm, game_id, game_hash):
    """Get match data.

    * game_realm, game_id and game_hash are retrieved through the league()
    and highlander_match() calls

    Parameters
    ----------
    game_realm : str
    game_id : int
    game_hash : str

    Returns
    -------
    JSON Data

    """
    url = f"https://acs.leagueoflegends.com/v1/stats/game/{game_realm}/{game_id}?gameHash={game_hash}"
    return requests.get(url)


def timeline(game_realm, game_id, game_hash):
    """Get timeline data for a match.

    Parameters
    ----------
    game_realm : str
    game_id : int
    game_hash : str

    Returns
    -------
    JSON Data

    """
    url = f"https://acs.leagueoflegends.com/v1/stats/game/{game_realm}/{game_id}/timeline?gameHash={game_hash}"
    return requests.get(url)

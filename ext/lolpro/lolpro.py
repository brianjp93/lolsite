import requests


def league(slug):
    """Get data about a league.

    Parameters
    ----------
    slug : str
        lcs, lec, lck, lpl...

    Returns
    -------
    JSON data

    """
    url = f'https://api.lolesports.com/api/v1/leagues?slug={slug}'
    return requests.get(url)


def highlander_match(tournament_id, match_id):
    """Get pro data about a match.

    Parameters
    ----------
    tournament_id : str
    match_id : str

    Returns
    -------
    JSON Data

    """
    url = f'https://api.lolesports.com/api/v2/highlanderMatchDetails?tournamentId={tournament_id}&matchId={match_id}'
    return requests.get(url)


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
    url = f'https://acs.leagueoflegends.com/v1/stats/game/{game_realm}/{game_id}?gameHash={game_hash}'
    return reqeusts.get(url)


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
    url = f'https://acs.leagueoflegends.com/v1/stats/game/{game_realm}/{game_id}/timeline?gameHash={game_hash}'
    return reqeusts.get(url)
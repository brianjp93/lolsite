"""
"""
from pro.models import League, LeagueAbout, LeagueName
from pro.models import LeagueTournament, TournamentRoster


from ext.lolpro import lolpro


def import_league(slug):
    """Import all data on a league with a given slug.

    Parameters
    ----------
    slug : str

    Returns
    -------
    None

    """
    r = lolpro.league(slug)
    data = r.json()


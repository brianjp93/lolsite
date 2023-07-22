import logging
from core.parsers import BaseModelWithLogger


logger = logging.getLogger(__name__)


class CDSummonerSpellParser(BaseModelWithLogger):
    id: int
    name: str
    description: str
    summonerLevel: int
    cooldown: int
    gameModes: list[str]
    iconPath: str

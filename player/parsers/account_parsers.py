import logging
from core.parsers import BaseModelWithLogger


logger = logging.getLogger(__name__)


class AccountParser(BaseModelWithLogger):
    puuid: str
    gameName: str | None = None
    tagLine: str | None = None

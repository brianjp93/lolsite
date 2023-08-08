import logging
from typing import Any

from pydantic import RootModel
from core.parsers import BaseModelWithLogger


logger = logging.getLogger(__name__)


class CDProfileIconParser(BaseModelWithLogger):
    id: int
    title: str
    yearReleased: int
    isLegacy: bool
    imagePath: str|None = ""
    descriptions: Any
    rarities: Any
    disabledRegions: Any
    esportsTeam: str | None = None
    esportsRegion: str | None = None
    esportsEvent: str | None = None


class CDProfileIconListParser(RootModel):
    root: list[CDProfileIconParser]

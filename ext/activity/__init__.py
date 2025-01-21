from typing import Type, TypedDict
from .oura import OuraAPI


class ACTIVITY_TYPE(TypedDict):
    OURA: Type[OuraAPI]

ACTIVITY: ACTIVITY_TYPE = {
    "OURA": OuraAPI,
}


__all__ = ["ACTIVITY"]

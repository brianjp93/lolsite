from typing import Any
from pydantic import BaseModel, root_validator, Extra
import logging


logger = logging.getLogger(__name__)


class BaseModelWithLogger(BaseModel, extra=Extra.allow):
    @root_validator(pre=True)
    def log_extra(cls, values: dict[str, Any]) -> dict[str, Any]:
        all_required_field_names = {field.alias for field in cls.__fields__.values()}
        extra: dict[str, Any] = {}
        for field_name in list(values):
            if field_name not in all_required_field_names:
                extra[field_name] = values.pop(field_name)
        if extra:
            logger.info(f'Extra fields detected on {cls.__class__.__name__}: {extra}')
        return values

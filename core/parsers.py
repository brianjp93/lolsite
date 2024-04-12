from pydantic import model_validator, BaseModel
import logging


logger = logging.getLogger(__name__)


class BaseModelWithLogger(BaseModel, extra='allow'):
    @model_validator(mode="after")
    def log_extra(self):
        extra = self.__pydantic_extra__
        if extra:
            logger.info(f'Extra fields detected on {self.__class__.__name__}: {extra}')
        return self

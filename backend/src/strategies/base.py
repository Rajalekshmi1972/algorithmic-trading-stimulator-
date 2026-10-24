from abc import ABC,abstractmethod
class BaseStrategy(ABC):
    key:str; name:str; description:str; default_params:dict
    @abstractmethod
    def validate(self,params): ...
    @abstractmethod
    def generate_signals(self,df,params): ...

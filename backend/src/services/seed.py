from src.models.entities import Strategy
from src.strategies.implementations import STRATEGIES
def seed(db):
    for k,s in STRATEGIES.items():
        if not db.query(Strategy).filter_by(key=k).first(): db.add(Strategy(key=k,name=s.name,description=s.description,default_params=s.default_params))
    db.commit()

from .implementations import STRATEGIES
def get_strategy(key):
    if key not in STRATEGIES: raise KeyError(f"Unknown strategy: {key}")
    return STRATEGIES[key]

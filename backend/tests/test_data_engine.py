import pytest
from backend.app.quant.data_engine import (
    clean_symbol,
    fetch_live_quote,
    fetch_live_quote_direct,
    CORPORATE_ALIASES,
)

def test_clean_symbol():
    assert clean_symbol(" bel.ns ") == "BEL"
    assert clean_symbol("RELIANCE.BO") == "RELIANCE"
    # TATAMOTORS resolves to TMPV due to corporate alias / ticker restructuring
    assert clean_symbol("tatamotors.ns") == "TMPV"

def test_live_quote_open_and_bounds():
    quote = fetch_live_quote("BEL")
    assert quote is not None
    assert quote["symbol"] == "BEL"
    assert quote["price"] > 0
    assert quote["open"] > 0
    assert quote["high"] >= quote["price"]
    assert quote["low"] <= quote["price"]
    assert quote["high"] >= quote["open"]
    assert quote["low"] <= quote["open"]
    assert quote["high_52w"] >= quote["low_52w"]
    assert quote["data_source"] in ["live_exchange", "sqlite_cache", "fallback_baseline"]
    assert isinstance(quote["is_estimated"], bool)

def test_quote_unknown_symbol_fallback():
    quote = fetch_live_quote("NON_EXISTENT_SYMBOL_XYZ999")
    assert quote is not None
    assert quote["price"] > 0
    assert quote["data_source"] == "fallback_baseline"
    assert quote["is_estimated"] is True

def test_quote_data_types():
    quote = fetch_live_quote("BEL")
    assert isinstance(quote["price"], (int, float))
    assert isinstance(quote["roce"], (int, float))
    assert isinstance(quote["roe"], (int, float))
    assert isinstance(quote["pe"], (int, float))

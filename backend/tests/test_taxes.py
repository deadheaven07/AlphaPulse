import pytest
from backend.app.quant.taxes_charges import calculate_indian_taxes_and_charges

def test_stcg_calculation():
    # Buy 1000 shares @ 100 = 100,000. Sell @ 150 = 150,000. Pre-tax gain ~ 49,824.55 -> 20% = 9,964.91
    result = calculate_indian_taxes_and_charges(
        buy_price=100.0,
        sell_price=150.0,
        shares=1000,
        holding_months=6
    )
    assert result["tax_type"] == "STCG (20%)"
    assert abs(result["capital_gains_tax"] - 9964.91) < 2.0
    assert result["stt"] > 0
    assert result["net_in_hand_profit"] > 0

def test_ltcg_calculation_exemption():
    # Gains exceeding 1.25 Lakh exemption
    result = calculate_indian_taxes_and_charges(
        buy_price=100.0,
        sell_price=300.0,
        shares=1000,
        holding_months=12
    )
    assert result["tax_type"] == "LTCG (12.5% above ₹1.25L)"
    assert result["capital_gains_tax"] > 0
    assert result["net_in_hand_profit"] > 0

def test_zero_shares_handling():
    result = calculate_indian_taxes_and_charges(
        buy_price=100.0,
        sell_price=150.0,
        shares=0,
        holding_months=6
    )
    assert result["net_in_hand_profit"] == 0.0

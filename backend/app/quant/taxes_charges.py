from typing import Dict, Any

def calculate_indian_taxes_and_charges(
    buy_price: float,
    sell_price: float,
    shares: int,
    holding_months: int,
    brokerage_per_order: float = 0.0  # Zero for equity delivery on Zerodha/Groww/AngelOne
) -> Dict[str, Any]:
    """
    Calculate exact Indian statutory charges, STT, GST, Stamp Duty, and Capital Gains Tax (STCG/LTCG).
    Rules compliant with Budget 2024 (STCG @ 20%, LTCG @ 12.5% above ₹1.25 Lakh exemption).
    """
    if shares <= 0 or buy_price <= 0:
        return {
            "gross_profit": 0.0,
            "stt": 0.0,
            "exchange_fees": 0.0,
            "sebi_charges": 0.0,
            "stamp_duty": 0.0,
            "gst": 0.0,
            "total_statutory_friction": 0.0,
            "pre_tax_profit": 0.0,
            "capital_gains_tax": 0.0,
            "tax_type": "STCG (20%)" if holding_months < 12 else "LTCG (12.5%)",
            "net_in_hand_profit": 0.0,
            "effective_post_tax_roi_pct": 0.0
        }

    entry_turnover = round(shares * buy_price, 2)
    exit_turnover = round(shares * sell_price, 2)
    total_turnover = round(entry_turnover + exit_turnover, 2)

    # 1. Gross Profit
    gross_profit = round(exit_turnover - entry_turnover, 2)

    # 2. Statutory Levies
    # STT (Securities Transaction Tax) = 0.1% on delivery sell turnover
    stt = round(exit_turnover * 0.001, 2)

    # Exchange Turnover Charges = ~0.00345% of total turnover (NSE)
    exchange_fees = round(total_turnover * 0.0000345, 2)

    # SEBI Turnover Charges = ₹10 per crore (0.0001% of total turnover)
    sebi_charges = round(total_turnover * 0.000001, 2)

    # Stamp Duty = 0.015% on buy turnover
    stamp_duty = round(entry_turnover * 0.00015, 2)

    # GST = 18% on (Brokerage + Exchange Fees + SEBI charges)
    taxable_services = (brokerage_per_order * 2) + exchange_fees + sebi_charges
    gst = round(taxable_services * 0.18, 2)

    total_statutory_friction = round(stt + exchange_fees + sebi_charges + stamp_duty + gst, 2)

    # 3. Pre-Tax Net Profit
    pre_tax_profit = round(gross_profit - total_statutory_friction, 2)

    # 4. Indian Capital Gains Tax (STCG vs LTCG)
    is_stcg = holding_months < 12
    capital_gains_tax = 0.0

    if pre_tax_profit > 0:
        if is_stcg:
            # STCG = 20% on all net gains (Budget 2024 revised rate)
            capital_gains_tax = round(pre_tax_profit * 0.20, 2)
            tax_type = "STCG (20%)"
        else:
            # LTCG = 12.5% on net gains above ₹1,25,000 annual exemption limit
            taxable_ltcg = max(0.0, pre_tax_profit - 125000.0)
            capital_gains_tax = round(taxable_ltcg * 0.125, 2)
            tax_type = "LTCG (12.5% above ₹1.25L)"
    else:
        tax_type = "STCG (20%)" if is_stcg else "LTCG (12.5%)"

    # 5. Real In-Hand Net Profit
    net_in_hand_profit = round(pre_tax_profit - capital_gains_tax, 2)
    effective_post_tax_roi_pct = round((net_in_hand_profit / entry_turnover) * 100, 2) if entry_turnover > 0 else 0.0

    return {
        "gross_profit": gross_profit,
        "entry_turnover": entry_turnover,
        "exit_turnover": exit_turnover,
        "stt": stt,
        "exchange_fees": exchange_fees,
        "sebi_charges": sebi_charges,
        "stamp_duty": stamp_duty,
        "gst": gst,
        "total_statutory_friction": total_statutory_friction,
        "pre_tax_profit": pre_tax_profit,
        "capital_gains_tax": capital_gains_tax,
        "tax_type": tax_type,
        "net_in_hand_profit": net_in_hand_profit,
        "effective_post_tax_roi_pct": effective_post_tax_roi_pct
    }

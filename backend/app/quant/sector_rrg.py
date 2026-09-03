from typing import Dict, Any

# Benchmark Sector RRG baseline profiles in Indian Equities (Relative to NIFTY 50)
SECTOR_RRG_PROFILES: Dict[str, Dict[str, Any]] = {
    "Auto & EV": {
        "rs_ratio": 104.2,
        "rs_momentum": 102.5,
        "quadrant": "Leading",
        "description": "Strong relative outperformance driven by premium SUV adoption and EV market expansion.",
        "color": "emerald"
    },
    "Defense": {
        "rs_ratio": 108.5,
        "rs_momentum": 103.8,
        "quadrant": "Leading",
        "description": "Top-tier sector leadership with record order backlogs and Make-in-India indigenization capex.",
        "color": "emerald"
    },
    "Infrastructure": {
        "rs_ratio": 103.8,
        "rs_momentum": 101.4,
        "quadrant": "Leading",
        "description": "Heavy government budget allocations and high industrial capex execution.",
        "color": "emerald"
    },
    "Energy & Power": {
        "rs_ratio": 105.1,
        "rs_momentum": 102.0,
        "quadrant": "Leading",
        "description": "Expanding renewable energy capacities, rooftop solar policy, and grid upgrades.",
        "color": "emerald"
    },
    "Retail & Consumer": {
        "rs_ratio": 102.4,
        "rs_momentum": 98.6,
        "quadrant": "Weakening",
        "description": "High relative strength with temporary valuation consolidation in discretionary spend.",
        "color": "amber"
    },
    "Banking": {
        "rs_ratio": 99.4,
        "rs_momentum": 101.8,
        "quadrant": "Improving",
        "description": "Improving credit growth and deposit accretion bottoming out with low NPAs.",
        "color": "indigo"
    },
    "IT Services": {
        "rs_ratio": 97.2,
        "rs_momentum": 98.4,
        "quadrant": "Lagging",
        "description": "Consolidating near-term discretionary spending while building enterprise AI pipelines.",
        "color": "rose"
    },
    "Pharma & Healthcare": {
        "rs_ratio": 98.8,
        "rs_momentum": 101.2,
        "quadrant": "Improving",
        "description": "Steady domestic market share gains and expanding global specialty portfolios.",
        "color": "indigo"
    }
}

def analyze_sector_rrg(sector_name: str) -> Dict[str, Any]:
    """
    Evaluate Relative Rotation Graph (RRG) quadrant for the stock's sector.
    Adapted from AdroitAnandAI/RRG-Sector-Rotation-India.
    """
    sec = sector_name.strip()
    
    # Fuzzy match sector
    for key, profile in SECTOR_RRG_PROFILES.items():
        if key.lower() in sec.lower() or sec.lower() in key.lower():
            return {
                "sector": key,
                "rs_ratio": profile["rs_ratio"],
                "rs_momentum": profile["rs_momentum"],
                "quadrant": profile["quadrant"],
                "description": profile["description"],
                "color": profile["color"]
            }
    
    # Default fallback profile
    return {
        "sector": sector_name or "Indian Equities",
        "rs_ratio": 100.5,
        "rs_momentum": 100.2,
        "quadrant": "Leading",
        "description": "Positive momentum relative to the broader NIFTY 50 benchmark.",
        "color": "emerald"
    }

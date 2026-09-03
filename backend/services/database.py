import sqlite3
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.config import DB_PATH

def get_db_connection() -> sqlite3.Connection:
    db_file = Path(DB_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_file))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Table for saved simulations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS simulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        company_name TEXT NOT NULL,
        capital REAL NOT NULL,
        horizon_months INTEGER NOT NULL,
        risk_tolerance TEXT NOT NULL,
        initial_price REAL NOT NULL,
        shares INTEGER NOT NULL,
        deployed_capital REAL NOT NULL,
        cash_buffer REAL NOT NULL,
        bull_target REAL NOT NULL,
        base_target REAL NOT NULL,
        bear_target REAL NOT NULL,
        bull_profit REAL NOT NULL,
        base_profit REAL NOT NULL,
        bear_profit REAL NOT NULL,
        expected_profit REAL NOT NULL,
        expected_roi_pct REAL NOT NULL,
        risk_reward_ratio REAL NOT NULL,
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL
    )
    """)

    # Table for watchlist
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        sector TEXT DEFAULT 'General',
        target_price REAL DEFAULT 0.0,
        notes TEXT DEFAULT '',
        added_at TEXT NOT NULL
    )
    """)

    # Populate default watchlist if empty
    cursor.execute("SELECT COUNT(*) FROM watchlist")
    if cursor.fetchone()[0] == 0:
        default_items = [
            ("RELIANCE", "Reliance Industries Ltd", "Conglomerate / Energy", 3200.0, "Core capex, Retail & Jio scaling"),
            ("TCS", "Tata Consultancy Services", "Information Technology", 4400.0, "IT leader, high ROCE"),
            ("HDFCBANK", "HDFC Bank Ltd", "Banking & Finance", 1850.0, "Credit growth and post-merger synergy"),
            ("TATAMOTORS", "Tata Motors Ltd", "Automotive & EV", 1100.0, "JLR deleveraging & EV leadership"),
            ("LICI", "Life Insurance Corp of India", "Financials / Insurance", 1200.0, "VNB margin expansion"),
            ("BEL", "Bharat Electronics Ltd", "Defense / Aerospace", 340.0, "Indigenization defense order backlog"),
        ]
        for symbol, name, sector, target, notes in default_items:
            cursor.execute(
                "INSERT OR IGNORE INTO watchlist (symbol, company_name, sector, target_price, notes, added_at) VALUES (?, ?, ?, ?, ?, ?)",
                (symbol, name, sector, target, notes, datetime.now().isoformat())
            )

    conn.commit()
    conn.close()

# Simulations CRUD
def create_simulation(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()

    cursor.execute("""
    INSERT INTO simulations (
        symbol, company_name, capital, horizon_months, risk_tolerance,
        initial_price, shares, deployed_capital, cash_buffer,
        bull_target, base_target, bear_target,
        bull_profit, base_profit, bear_profit,
        expected_profit, expected_roi_pct, risk_reward_ratio,
        notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["symbol"].upper(),
        data.get("company_name", data["symbol"]),
        data["capital"],
        data["horizon_months"],
        data.get("risk_tolerance", "MODERATE"),
        data["initial_price"],
        data["shares"],
        data["deployed_capital"],
        data["cash_buffer"],
        data["bull_target"],
        data["base_target"],
        data["bear_target"],
        data["bull_profit"],
        data["base_profit"],
        data["bear_profit"],
        data["expected_profit"],
        data["expected_roi_pct"],
        data.get("risk_reward_ratio", 2.0),
        data.get("notes", ""),
        data.get("status", "ACTIVE"),
        created_at
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return get_simulation_by_id(new_id)

def get_simulations() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM simulations ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_simulation_by_id(sim_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM simulations WHERE id = ?", (sim_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_simulation_status(sim_id: int, status: str, notes: Optional[str] = None) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    if notes is not None:
        cursor.execute("UPDATE simulations SET status = ?, notes = ? WHERE id = ?", (status, notes, sim_id))
    else:
        cursor.execute("UPDATE simulations SET status = ? WHERE id = ?", (status, sim_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

def delete_simulation(sim_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM simulations WHERE id = ?", (sim_id,))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

# Watchlist CRUD
def get_watchlist() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM watchlist ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_to_watchlist(symbol: str, company_name: str, sector: str = "General", target_price: float = 0.0, notes: str = "") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    added_at = datetime.now().isoformat()
    cursor.execute("""
    INSERT OR REPLACE INTO watchlist (symbol, company_name, sector, target_price, notes, added_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (symbol.upper(), company_name, sector, target_price, notes, added_at))
    conn.commit()
    conn.close()
    return {"symbol": symbol.upper(), "company_name": company_name, "sector": sector, "target_price": target_price, "notes": notes, "added_at": added_at}

def remove_from_watchlist(symbol: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM watchlist WHERE symbol = ?", (symbol.upper(),))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

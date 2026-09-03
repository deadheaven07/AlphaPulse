import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "alphapulse.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    """Initialize SQLite tables for persistent portfolio holdings and watchlist."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_holdings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                company_name TEXT,
                entry_price REAL NOT NULL,
                shares INTEGER NOT NULL,
                target_price REAL,
                stop_loss REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                symbol TEXT PRIMARY KEY,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

def get_holdings() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM portfolio_holdings ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def add_holding(
    symbol: str,
    entry_price: float,
    shares: int,
    company_name: Optional[str] = None,
    target_price: Optional[float] = None,
    stop_loss: Optional[float] = None
) -> Dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO portfolio_holdings (symbol, company_name, entry_price, shares, target_price, stop_loss)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (symbol.upper().strip(), company_name or symbol, entry_price, shares, target_price, stop_loss))
        conn.commit()
        holding_id = cursor.lastrowid
        cursor.execute("SELECT * FROM portfolio_holdings WHERE id = ?", (holding_id,))
        row = cursor.fetchone()
        return dict(row) if row else {}

def delete_holding(holding_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM portfolio_holdings WHERE id = ?", (holding_id,))
        conn.commit()
        return cursor.rowcount > 0

def clear_all_holdings() -> bool:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM portfolio_holdings")
        conn.commit()
        return True

def get_watchlist() -> List[str]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT symbol FROM watchlist ORDER BY added_at ASC")
        rows = cursor.fetchall()
        return [row["symbol"] for row in rows]

def add_watchlist(symbol: str) -> bool:
    sym = symbol.upper().strip()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT OR IGNORE INTO watchlist (symbol) VALUES (?)", (sym,))
        conn.commit()
        return True

def delete_watchlist(symbol: str) -> bool:
    sym = symbol.upper().strip()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM watchlist WHERE symbol = ?", (sym,))
        conn.commit()
        return cursor.rowcount > 0

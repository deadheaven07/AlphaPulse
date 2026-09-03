import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "alphapulse.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    """Initialize SQLite tables with WAL mode for high-concurrency read/write operations."""
    with get_connection() as conn:
        cursor = conn.cursor()
        # Concurrency & Performance Hardening
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA busy_timeout=5000;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        
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
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS goal_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                target_amount REAL NOT NULL,
                starting_capital REAL NOT NULL,
                monthly_sip REAL DEFAULT 0,
                horizon_months INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                planned_basket TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tactical_swings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                company_name TEXT,
                entry_price REAL NOT NULL,
                allocated_capital REAL NOT NULL,
                shares INTEGER NOT NULL,
                target_1 REAL NOT NULL,
                target_2 REAL NOT NULL,
                stop_loss REAL NOT NULL,
                entry_date TEXT NOT NULL,
                expiry_date TEXT NOT NULL,
                status TEXT DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

def get_goals() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM goal_plans ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def save_goal(
    title: str,
    target_amount: float,
    starting_capital: float,
    monthly_sip: float = 0.0,
    horizon_months: int = 12,
    risk_level: str = "Moderate",
    planned_basket: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO goal_plans (title, target_amount, starting_capital, monthly_sip, horizon_months, risk_level, planned_basket, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (title.strip(), target_amount, starting_capital, monthly_sip, horizon_months, risk_level, planned_basket, notes))
        conn.commit()
        goal_id = cursor.lastrowid
        cursor.execute("SELECT * FROM goal_plans WHERE id = ?", (goal_id,))
        row = cursor.fetchone()
        return dict(row) if row else {}

def delete_goal(goal_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM goal_plans WHERE id = ?", (goal_id,))
        conn.commit()
        return cursor.rowcount > 0

def save_tactical_swing(
    symbol: str,
    company_name: str,
    entry_price: float,
    allocated_capital: float,
    shares: int,
    target_1: float,
    target_2: float,
    stop_loss: float,
    entry_date: str,
    expiry_date: str,
    status: str = "ACTIVE"
) -> Dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tactical_swings (symbol, company_name, entry_price, allocated_capital, shares, target_1, target_2, stop_loss, entry_date, expiry_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (symbol.upper().strip(), company_name.strip(), entry_price, allocated_capital, shares, target_1, target_2, stop_loss, entry_date, expiry_date, status))
        conn.commit()
        swing_id = cursor.lastrowid
        cursor.execute("SELECT * FROM tactical_swings WHERE id = ?", (swing_id,))
        row = cursor.fetchone()
        return dict(row) if row else {}

def get_active_tactical_swings() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tactical_swings WHERE status = 'ACTIVE' ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_all_tactical_swings() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tactical_swings ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def update_tactical_swing_status(swing_id: int, status: str) -> bool:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE tactical_swings SET status = ? WHERE id = ?", (status, swing_id))
        conn.commit()
        return cursor.rowcount > 0

def delete_tactical_swing(swing_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tactical_swings WHERE id = ?", (swing_id,))
        conn.commit()
        return cursor.rowcount > 0



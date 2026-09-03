import sqlite3
import os
import datetime
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
                entry_low REAL NOT NULL DEFAULT 0,
                entry_high REAL NOT NULL DEFAULT 0,
                allocated_capital REAL NOT NULL,
                shares INTEGER NOT NULL,
                target_1 REAL NOT NULL,
                target_2 REAL NOT NULL,
                stop_loss REAL NOT NULL,
                entry_date TEXT,
                expiry_date TEXT,
                holding_days INTEGER DEFAULT 7,
                extended_days INTEGER DEFAULT 0,
                status TEXT DEFAULT 'WAITING_FOR_ENTRY',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Schema migration check for existing columns
        cursor.execute("PRAGMA table_info(tactical_swings)")
        columns = [row["name"] for row in cursor.fetchall()]
        if "entry_low" not in columns:
            cursor.execute("ALTER TABLE tactical_swings ADD COLUMN entry_low REAL DEFAULT 0")
        if "entry_high" not in columns:
            cursor.execute("ALTER TABLE tactical_swings ADD COLUMN entry_high REAL DEFAULT 0")
        if "holding_days" not in columns:
            cursor.execute("ALTER TABLE tactical_swings ADD COLUMN holding_days INTEGER DEFAULT 7")
        if "extended_days" not in columns:
            cursor.execute("ALTER TABLE tactical_swings ADD COLUMN extended_days INTEGER DEFAULT 0")

        conn.commit()

def get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    """Fetch setting value by key from SQLite."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM app_settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row["value"] if row else default

def set_setting(key: str, value: str) -> None:
    """Store or update setting value by key in SQLite."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO app_settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        """, (key, value))
        conn.commit()

def get_all_settings() -> Dict[str, str]:
    """Fetch all saved app settings from SQLite."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM app_settings")
        rows = cursor.fetchall()
        return {row["key"]: row["value"] for row in rows}

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

# --- TACTICAL SWINGS & PRE-BUY WATCHDOG LIFECYCLE ---

def arm_prebuy_trigger(
    symbol: str,
    company_name: str,
    entry_price: float,
    entry_low: float,
    entry_high: float,
    allocated_capital: float,
    shares: int,
    target_1: float,
    target_2: float,
    stop_loss: float,
    holding_days: int = 7
) -> Dict[str, Any]:
    """Saves high-probability setup into WAITING_FOR_ENTRY state with pre-buy trigger zone."""
    now = datetime.datetime.now()
    entry_date = now.strftime("%Y-%m-%d")
    expiry_date = (now + datetime.timedelta(days=holding_days)).strftime("%Y-%m-%d")

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tactical_swings (
                symbol, company_name, entry_price, entry_low, entry_high,
                allocated_capital, shares, target_1, target_2, stop_loss,
                entry_date, expiry_date, holding_days, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING_FOR_ENTRY')
        """, (
            symbol.upper().strip(), company_name.strip(), entry_price,
            entry_low, entry_high, allocated_capital, shares,
            target_1, target_2, stop_loss, entry_date, expiry_date,
            holding_days
        ))
        conn.commit()
        swing_id = cursor.lastrowid
        cursor.execute("SELECT * FROM tactical_swings WHERE id = ?", (swing_id,))
        row = cursor.fetchone()
        return dict(row) if row else {}

def confirm_tactical_entry(swing_id: int, actual_entry_price: Optional[float] = None) -> bool:
    """Transitions from WAITING_FOR_ENTRY -> ACTIVE_HOLDING and starts the 7-day countdown clock."""
    now = datetime.datetime.now()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT holding_days, entry_price FROM tactical_swings WHERE id = ?", (swing_id,))
        row = cursor.fetchone()
        if not row:
            return False
        h_days = row["holding_days"] or 7
        e_price = actual_entry_price if (actual_entry_price and actual_entry_price > 0) else row["entry_price"]
        expiry = now + datetime.timedelta(days=h_days)

        cursor.execute("""
            UPDATE tactical_swings
            SET status = 'ACTIVE_HOLDING',
                entry_price = ?,
                entry_date = ?,
                expiry_date = ?
            WHERE id = ?
        """, (e_price, now.strftime("%Y-%m-%d %H:%M:%S"), expiry.strftime("%Y-%m-%d %H:%M:%S"), swing_id))
        conn.commit()
        return True

def extend_tactical_holding(swing_id: int, extra_days: int, new_stop_loss: Optional[float] = None) -> bool:
    """Extends holding period by extra_days and updates trailing stop-loss in SQLite."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT expiry_date, extended_days, stop_loss FROM tactical_swings WHERE id = ?", (swing_id,))
        row = cursor.fetchone()
        if not row:
            return False

        try:
            current_expiry = datetime.datetime.strptime(row["expiry_date"], "%Y-%m-%d %H:%M:%S") if row["expiry_date"] else datetime.datetime.now()
        except Exception:
            current_expiry = datetime.datetime.now()

        new_expiry = current_expiry + datetime.timedelta(days=extra_days)
        new_ext_days = (row["extended_days"] or 0) + extra_days
        updated_sl = new_stop_loss if (new_stop_loss and new_stop_loss > 0) else row["stop_loss"]

        cursor.execute("""
            UPDATE tactical_swings
            SET expiry_date = ?,
                extended_days = ?,
                stop_loss = ?
            WHERE id = ?
        """, (new_expiry.strftime("%Y-%m-%d %H:%M:%S"), new_ext_days, updated_sl, swing_id))
        conn.commit()
        return True

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
    status: str = "ACTIVE_HOLDING",
    entry_low: float = 0.0,
    entry_high: float = 0.0,
    holding_days: int = 7
) -> Dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tactical_swings (
                symbol, company_name, entry_price, entry_low, entry_high,
                allocated_capital, shares, target_1, target_2, stop_loss,
                entry_date, expiry_date, holding_days, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            symbol.upper().strip(), company_name.strip(), entry_price,
            entry_low or (entry_price * 0.995), entry_high or (entry_price * 1.008),
            allocated_capital, shares, target_1, target_2, stop_loss,
            entry_date, expiry_date, holding_days, status
        ))
        conn.commit()
        swing_id = cursor.lastrowid
        cursor.execute("SELECT * FROM tactical_swings WHERE id = ?", (swing_id,))
        row = cursor.fetchone()
        return dict(row) if row else {}

def get_tactical_swing_by_id(swing_id: int) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tactical_swings WHERE id = ?", (swing_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_active_tactical_swings() -> List[Dict[str, Any]]:
    """Returns active holdings where status is ACTIVE or ACTIVE_HOLDING."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tactical_swings WHERE status IN ('ACTIVE', 'ACTIVE_HOLDING') ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_prebuy_tactical_swings() -> List[Dict[str, Any]]:
    """Returns tactical setups waiting for entry dip."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tactical_swings WHERE status = 'WAITING_FOR_ENTRY' ORDER BY created_at DESC")
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

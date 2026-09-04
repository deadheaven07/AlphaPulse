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

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS intraday_trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                company_name TEXT,
                direction TEXT NOT NULL,
                entry_price REAL NOT NULL,
                shares INTEGER NOT NULL,
                margin_capital REAL NOT NULL,
                total_exposure REAL NOT NULL,
                leverage_multiplier REAL DEFAULT 5.0,
                target_price REAL NOT NULL,
                stop_loss REAL NOT NULL,
                orb_high REAL DEFAULT 0,
                orb_low REAL DEFAULT 0,
                vwap REAL DEFAULT 0,
                status TEXT DEFAULT 'ACTIVE',
                exit_price REAL,
                net_pnl REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS live_stock_cache (
                symbol TEXT PRIMARY KEY,
                company_name TEXT NOT NULL,
                price REAL NOT NULL,
                change REAL NOT NULL,
                change_pct REAL NOT NULL,
                open REAL,
                high REAL,
                low REAL,
                prev_close REAL,
                high_52w REAL,
                low_52w REAL,
                volume INTEGER,
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

# --- Intraday MIS 5x Trades CRUD ---

def create_intraday_trade(data: Dict[str, Any]) -> int:
    """Inserts a new intraday MIS position with 5x leverage parameters."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO intraday_trades (
                symbol, company_name, direction, entry_price, shares,
                margin_capital, total_exposure, leverage_multiplier,
                target_price, stop_loss, orb_high, orb_low, vwap, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["symbol"].upper(),
            data.get("company_name", data["symbol"]),
            data["direction"].upper(),
            float(data["entry_price"]),
            int(data["shares"]),
            float(data["margin_capital"]),
            float(data["total_exposure"]),
            float(data.get("leverage_multiplier", 5.0)),
            float(data["target_price"]),
            float(data["stop_loss"]),
            float(data.get("orb_high", 0.0)),
            float(data.get("orb_low", 0.0)),
            float(data.get("vwap", 0.0)),
            data.get("status", "ACTIVE")
        ))
        conn.commit()
        return cursor.lastrowid

def get_active_intraday_trades() -> List[Dict[str, Any]]:
    """Returns currently active intraday trades awaiting target, SL, or 3:10 PM square-off."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM intraday_trades WHERE status = 'ACTIVE' ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_all_intraday_trades() -> List[Dict[str, Any]]:
    """Returns all intraday trades including historical squared-off trades."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM intraday_trades ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_intraday_trade_by_id(trade_id: int) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM intraday_trades WHERE id = ?", (trade_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def square_off_intraday_trade(trade_id: int, exit_price: float, net_pnl: float, reason: str = "MANUAL_SQUARE_OFF") -> bool:
    """Closes an active intraday trade and logs the exit price, net PnL, and timestamp."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE intraday_trades
            SET status = ?, exit_price = ?, net_pnl = ?, closed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (reason, float(exit_price), float(net_pnl), trade_id))
        conn.commit()
        return cursor.rowcount > 0

def update_intraday_trade_status(
    trade_id: int,
    status: str,
    exit_price: Optional[float] = None,
    net_pnl: Optional[float] = None
) -> bool:
    with get_connection() as conn:
        cursor = conn.cursor()
        if exit_price is not None and net_pnl is not None:
            cursor.execute("""
                UPDATE intraday_trades
                SET status = ?, exit_price = ?, net_pnl = ?, closed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (status, float(exit_price), float(net_pnl), trade_id))
        else:
            cursor.execute("UPDATE intraday_trades SET status = ? WHERE id = ?", (status, trade_id))
        conn.commit()
        return cursor.rowcount > 0

def delete_intraday_trade(trade_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM intraday_trades WHERE id = ?", (trade_id,))
        conn.commit()
        return cursor.rowcount > 0

def save_live_quote_cache(data: Dict[str, Any]) -> None:
    """Saves or updates a verified live quote into persistent SQLite storage."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO live_stock_cache (
                symbol, company_name, price, change, change_pct,
                open, high, low, prev_close, high_52w, low_52w, volume, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(symbol) DO UPDATE SET
                company_name = excluded.company_name,
                price = excluded.price,
                change = excluded.change,
                change_pct = excluded.change_pct,
                open = excluded.open,
                high = excluded.high,
                low = excluded.low,
                prev_close = excluded.prev_close,
                high_52w = excluded.high_52w,
                low_52w = excluded.low_52w,
                volume = excluded.volume,
                updated_at = CURRENT_TIMESTAMP
        """, (
            data["symbol"].upper(),
            data.get("company_name", data["symbol"]),
            float(data["price"]),
            float(data.get("change", 0.0)),
            float(data.get("change_pct", 0.0)),
            float(data.get("open", data["price"])),
            float(data.get("high", data["price"])),
            float(data.get("low", data["price"])),
            float(data.get("prev_close", data["price"])),
            float(data.get("high_52w", data["price"] * 1.25)),
            float(data.get("low_52w", data["price"] * 0.75)),
            int(data.get("volume", 0))
        ))
        conn.commit()

def get_live_quote_cache(symbol: str) -> Optional[Dict[str, Any]]:
    """Retrieves the last verified price from SQLite."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM live_stock_cache WHERE symbol = ?", (symbol.upper(),))
        row = cursor.fetchone()
        return dict(row) if row else None


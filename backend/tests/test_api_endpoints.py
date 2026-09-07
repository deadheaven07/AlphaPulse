import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "healthy"
    assert "app" in data
    assert "engine_sources" in data
    assert len(data["engine_sources"]) >= 5

def test_market_status_endpoint():
    resp = client.get("/api/stocks/market-status")
    assert resp.status_code == 200
    data = resp.json()
    assert "sentiment" in data
    assert "fii_net_cr" in data
    assert "dii_net_cr" in data

def test_simulator_calculate():
    resp = client.post(
        "/api/simulator/calculate",
        json={
            "symbol": "BEL",
            "capital": 100000.0,
            "horizon_months": 12,
            "risk_tolerance": "Moderate"
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "bull_case" in data
    assert "base_case" in data
    assert "bear_case" in data
    assert "expected_value" in data
    assert data["deployed_capital"] > 0

def test_diagnostics_self_test():
    resp = client.get("/api/diagnostics/self-test")
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall_status"] == "HEALTHY"
    assert data["failed"] == 0
    assert data["passed"] >= 8

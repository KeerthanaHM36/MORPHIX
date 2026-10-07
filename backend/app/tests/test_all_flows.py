import sys
import os
import pytest
from uuid import UUID

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token():
    response = client.post("/api/auth/login", json={
        "email": "manager@morphix.io",
        "password": "Password123!"
    })
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture
def token():
    return get_auth_token()

def ensure_demo_state(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    techs = client.get("/api/technicians", headers=headers).json()
    t1 = next((t for t in techs if t["employee_code"] == "T1"), None)
    if t1:
        client.put(
            f"/api/technicians/{t1['id']}",
            json={"availability_status": "AVAILABLE", "current_workload": 0},
            headers=headers
        )
        srs = client.get("/api/service-requests?status=ASSIGNED", headers=headers).json()
        sr1001 = next((s for s in srs if s["request_code"] == "SR-1001"), None)
        if sr1001:
            assgns = client.get(f"/api/assignments?service_request_id={sr1001['id']}", headers=headers).json()
            if assgns:
                client.put(
                    f"/api/assignments/{assgns[0]['id']}",
                    json={"technician_id": t1["id"], "assignment_status": "ASSIGNED"},
                    headers=headers
                )

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    print("[PASS] Health check passed")

def test_auth_login():
    response = client.post("/api/auth/login", json={
        "email": "manager@morphix.io",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "manager@morphix.io"
    print("[PASS] Manager login passed")

def test_dashboard_metrics(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert data["kpis"]["open_service_requests"] > 0
    assert data["kpis"]["technicians_available"] > 0
    print("[PASS] Dashboard metrics passed")

def test_technician_matching(token):
    ensure_demo_state(token)
    headers = {"Authorization": f"Bearer {token}"}
    requests_resp = client.get("/api/service-requests?status=ASSIGNED", headers=headers)
    assert requests_resp.status_code == 200
    sr1001 = [r for r in requests_resp.json() if r["request_code"] == "SR-1001"][0]
    
    match_resp = client.get(f"/api/assignments/match/{sr1001['id']}", headers=headers)
    assert match_resp.status_code == 200
    candidates = match_resp.json()
    assert len(candidates) > 0
    assert candidates[0]["is_eligible"] is True
    print(f"[PASS] Technician matching passed. Top candidate: {candidates[0]['name']} (Score: {candidates[0]['match_score']})")

def test_disruption_and_recovery_flow(token):
    ensure_demo_state(token)
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Trigger disruption: Mark T1 unavailable
    techs_resp = client.get("/api/technicians", headers=headers)
    t1 = [t for t in techs_resp.json() if t["employee_code"] == "T1"][0]
    
    disrupt_resp = client.post(
        f"/api/technicians/{t1['id']}/trigger-unavailable?reason=Vehicle%20Transmission%20Failure",
        headers=headers
    )
    assert disrupt_resp.status_code == 200
    exceptions = disrupt_resp.json()
    assert len(exceptions) > 0
    exc = exceptions[0]
    print(f"[PASS] Disruption trigger created exception: '{exc['title']}' [Severity: {exc['severity']}]")

    # 2. Retrieve generated recovery plans
    plans_resp = client.get(f"/api/exceptions/{exc['id']}/plans", headers=headers)
    assert plans_resp.status_code == 200
    plans = plans_resp.json()
    assert len(plans) >= 2
    best_plan = plans[0]
    print(f"[PASS] Recovery engine generated {len(plans)} plans. Top Plan: '{best_plan['plan_name']}' [Score: {best_plan['score']}]")

    # 3. Apply recovery plan
    apply_resp = client.post(
        "/api/recovery/apply",
        json={"plan_id": best_plan["id"], "notes": "Automated test orchestration approval"},
        headers=headers
    )
    assert apply_resp.status_code == 200
    applied_plan = apply_resp.json()
    assert applied_plan["status"] == "APPLIED"
    print(f"[PASS] Orchestrated recovery plan applied successfully: '{applied_plan['plan_name']}'")

    # 4. Verify exception is resolved
    exc_check = client.get(f"/api/exceptions/{exc['id']}", headers=headers).json()
    assert exc_check["status"] == "RESOLVED"
    print("[PASS] Exception confirmed RESOLVED in database")

def test_counterfactual_simulation(token):
    headers = {"Authorization": f"Bearer {token}"}
    scenarios_resp = client.get("/api/simulations", headers=headers)
    assert scenarios_resp.status_code == 200
    scenarios = scenarios_resp.json()
    assert len(scenarios) > 0
    scen = scenarios[0]

    run_resp = client.post(f"/api/simulations/{scen['id']}/run", headers=headers)
    assert run_resp.status_code == 200
    result = run_resp.json()
    assert "current_state" in result
    assert "simulated_state" in result
    assert "impact_analysis" in result
    print(f"[PASS] Simulation run succeeded for scenario '{result['scenario_name']}'. Impacted jobs: {result['impact_analysis']['impacted_jobs_count']}")

if __name__ == "__main__":
    print("Starting MORPHIX automated test suite...")
    test_health_check()
    test_auth_login()
    t = get_auth_token()
    test_dashboard_metrics(t)
    test_technician_matching(t)
    test_disruption_and_recovery_flow(t)
    test_counterfactual_simulation(t)
    print("\nALL 5 CORE TEST SUITES PASSED PERFECTLY!")

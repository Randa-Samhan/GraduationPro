import app as server


def test_normalize_role_positive():
    assert server.normalize_role("police") == "police"
    assert server.normalize_role("transport") == "transport"


def test_normalize_role_negative_defaults_to_driver():
    assert server.normalize_role("citizen") == "driver"
    assert server.normalize_role(None) == "driver"


def test_build_violation_email_body_contains_only_link_and_notice():
    body = server.build_violation_email_body("Ahmad", "http://localhost:5173/violations/55")

    assert "Ahmad" in body
    assert "http://localhost:5173/violations/55" in body
    assert "Location:" not in body
    assert "Total fine:" not in body
    assert "Plate number:" not in body

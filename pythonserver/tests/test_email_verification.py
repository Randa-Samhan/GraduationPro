import app as server


class DummyCursor:
    def __init__(self, existing=None):
        self._existing = existing
        self.executed = []

    def execute(self, query, params=None):
        self.executed.append((query, params))

    def fetchone(self):
        return self._existing

    def close(self):
        return None


class DummyConn:
    def __init__(self, cursor):
        self._cursor = cursor

    def cursor(self, dictionary=True, buffered=True):
        return self._cursor

    def close(self):
        return None


def test_send_email_verification_code_positive(client, monkeypatch):
    monkeypatch.setattr(server, "get_db_connection", lambda: DummyConn(DummyCursor(existing=None)))
    monkeypatch.setattr(server, "send_email", lambda *_args, **_kwargs: True)

    res = client.post(
        "/api/citizens/send-email-verification-code",
        json={"newEmail": "test@example.com", "idNumber": "123456789"},
    )

    assert res.status_code == 200
    data = res.get_json()
    assert data["message"] == "Verification code sent successfully"

    assert "test@example.com" in server.email_verification_codes
    assert len(server.email_verification_codes["test@example.com"]["code"]) == 6


def test_send_email_verification_code_negative_missing_fields(client):
    res = client.post("/api/citizens/send-email-verification-code", json={})
    assert res.status_code == 400
    assert res.get_json()["error"] == "Email and ID number are required"


def test_send_email_verification_code_negative_invalid_email(client):
    res = client.post(
        "/api/citizens/send-email-verification-code",
        json={"newEmail": "not-an-email", "idNumber": "123456789"},
    )
    assert res.status_code == 400
    assert res.get_json()["error"] == "Invalid email format"


def test_send_email_verification_code_negative_email_already_in_use(client, monkeypatch):
    monkeypatch.setattr(server, "get_db_connection", lambda: DummyConn(DummyCursor(existing={"id_number": "000"})))
    monkeypatch.setattr(server, "send_email", lambda *_args, **_kwargs: True)

    res = client.post(
        "/api/citizens/send-email-verification-code",
        json={"newEmail": "exists@example.com", "idNumber": "123456789"},
    )

    assert res.status_code == 400
    assert res.get_json()["error"] == "Email already in use"


def test_send_email_verification_code_negative_db_connection_failed(client, monkeypatch):
    monkeypatch.setattr(server, "get_db_connection", lambda: None)

    res = client.post(
        "/api/citizens/send-email-verification-code",
        json={"newEmail": "test@example.com", "idNumber": "123456789"},
    )

    assert res.status_code == 500
    assert res.get_json()["error"] == "Database connection failed"


import pytest

import app as server


@pytest.fixture(autouse=True)
def _clear_email_verification_codes():
    server.email_verification_codes.clear()
    yield
    server.email_verification_codes.clear()


@pytest.fixture()
def client():
    server.app.config.update(TESTING=True)
    with server.app.test_client() as client:
        yield client


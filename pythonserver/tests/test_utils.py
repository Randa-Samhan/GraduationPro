import app as server


def test_allowed_file_positive():
    assert server.allowed_file("photo.jpg") is True
    assert server.allowed_file("photo.PNG") is True


def test_allowed_file_negative():
    assert server.allowed_file("photo.txt") is False
    assert server.allowed_file("photo") is False


def test_verify_password_positive():
    hashed = server.hash_password("secret")
    assert server.verify_password("secret", hashed) is True


def test_verify_password_negative():
    hashed = server.hash_password("secret")
    assert server.verify_password("wrong", hashed) is False


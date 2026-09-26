class BaseCloudDriver:
    def test_connection(self, credentials: dict) -> tuple[bool, str, dict]:
        raise NotImplementedError

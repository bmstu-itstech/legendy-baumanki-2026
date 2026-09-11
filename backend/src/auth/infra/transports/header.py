from src.auth.infra.transports.base import IAuthTransport
from starlette.requests import Request
from starlette.responses import Response


class HeaderTransport(IAuthTransport):
    def __init__(
        self,
        header_name: str,
        token_type_prefix: str | None = None,
    ) -> None:
        self.header_name = header_name
        self.token_type_prefix = token_type_prefix

    def set_token(self, response: Response, token: str) -> None:
        if self.token_type_prefix:
            token_value = f"{self.token_type_prefix} {token}"
        else:
            token_value = token
        response.headers[self.header_name] = token_value

    def delete_token(self, response: Response) -> None:
        response.headers[self.header_name] = ""

    def get_token(self, request: Request) -> str | None:
        header = request.headers.get(self.header_name, None)
        if header:
            try:
                return header.split(" ")[1]
            except IndexError:
                return header
        return None

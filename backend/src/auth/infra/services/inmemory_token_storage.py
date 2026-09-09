from src.auth.domain.entities import TokenData
from src.auth.domain.interfaces.token_storage import ITokenStorage

_tokens: dict[str, TokenData] = {}


class InMemoryTokenStorage(ITokenStorage):
    async def store_token(self, token: TokenData) -> None:
        if token.jti:
            _tokens[token.jti] = token

    async def revoke_tokens_by_user(self, user_id: int) -> None:
        for jti, token in _tokens.items():
            if token.uid == user_id:
                _tokens.pop(jti)

    async def is_token_active(self, jti: str) -> bool:
        return jti in _tokens

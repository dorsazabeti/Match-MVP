from typing import Literal

from pydantic import BaseModel


class RoleSelectionRequest(BaseModel):
    role: Literal[
        "BUSINESS",
        "PUBLISHER",
    ]


class RoleSelectionResponse(BaseModel):
    id: str
    email: str
    role: str

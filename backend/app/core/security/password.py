from passlib.context import CryptContext


password_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Convert a plain password into a secure hash.

    The original password cannot be recovered from this value.
    """

    return password_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Check whether a password matches its stored hash.
    """

    return password_context.verify(
        plain_password,
        hashed_password,
    )

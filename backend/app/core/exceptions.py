class UserAlreadyExists(Exception):
    """
    Raised when trying to create a user
    with an email that already exists.
    """

    pass


class InvalidCredentials(Exception):
    """
    Raised when login credentials are incorrect.
    """

    pass

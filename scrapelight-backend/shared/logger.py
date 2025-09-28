import logging
import os
from datetime import datetime
from shared.config import settings


def setup_logger(name: str = None, log_level: str = "INFO") -> logging.Logger:
    """
    Set up a comprehensive logger with file and console handlers.

    Args:
        name: Logger name (usually __name__)
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """

    # Create logger
    logger = logging.getLogger(name or __name__)
    logger.setLevel(getattr(logging, log_level.upper()))

    # Avoid duplicate handlers if logger already exists
    if logger.handlers:
        return logger

    # Create formatters
    detailed_formatter = logging.Formatter(
        fmt='%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(funcName)s() | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    console_formatter = logging.Formatter(
        fmt='%(asctime)s | %(levelname)-8s | %(filename)s:%(lineno)d | %(message)s',
        datefmt='%H:%M:%S'
    )

  # #  File handler - detailed logs
  #   log_filename = f"scraper_{datetime.now().strftime('%Y%m%d')}.log"
  #   file_handler = logging.FileHandler(log_dir / log_filename)
  #   file_handler.setLevel(logging.DEBUG)
  #   file_handler.setFormatter(detailed_formatter)

    # Console handler - clean output
    # console_handler = logging.StreamHandler()
    # console_handler.setLevel(logging.INFO)
    # console_handler.setFormatter(console_formatter)

    # Add handlers to logger
    # logger.addHandler(file_handler)
    # logger.addHandler(console_handler)

    return logger

def get_logger(name: str = None) -> logging.Logger:
    """
    Get an existing logger instance.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Existing logger instance
    """
    return logging.getLogger(name or __name__)
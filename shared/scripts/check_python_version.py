import sys

REQUIRED_MIN_VERSION = (3, 10)
REQUIRED_MAX_VERSION = (3, 13)

if REQUIRED_MIN_VERSION < sys.version_info < REQUIRED_MAX_VERSION:
    print(
        f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} is valid."
    )
    sys.exit(0)  # Valid Python version
else:
    print(
        f"❌ Error: Detected Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}. "
        f"Required: >{REQUIRED_MIN_VERSION[0]}.{REQUIRED_MIN_VERSION[1]} and <{REQUIRED_MAX_VERSION[0]}.{REQUIRED_MAX_VERSION[1]}",
        file=sys.stderr,
    )
    sys.exit(1)  # Invalid Python version

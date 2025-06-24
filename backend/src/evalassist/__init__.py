import logging

import litellm

litellm.drop_params = True

# print(
#     r"""
# .-----------------------------------------------------------------------------.
# |███████╗██╗   ██╗ █████╗ ██╗      █████╗ ███████╗███████╗██╗███████╗████████╗|
# |██╔════╝██║   ██║██╔══██╗██║     ██╔══██╗██╔════╝██╔════╝██║██╔════╝╚══██╔══╝|
# |█████╗  ██║   ██║███████║██║     ███████║███████╗███████╗██║███████╗   ██║   |
# |██╔══╝  ╚██╗ ██╔╝██╔══██║██║     ██╔══██║╚════██║╚════██║██║╚════██║   ██║   |
# |███████╗ ╚████╔╝ ██║  ██║███████╗██║  ██║███████║███████║██║███████║   ██║   |
# |╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚══════╝   ╚═╝   |
# '-----------------------------------------------------------------------------'
# """.encode('utf-8')
# )

root_pkg_logger = logging.getLogger(__name__)
root_pkg_logger.propagate = False

handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)

formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(lineno)d - %(levelname)s - %(message)s"
)
handler.setFormatter(formatter)

root_pkg_logger.addHandler(handler)

root_pkg_logger.setLevel(logging.DEBUG)

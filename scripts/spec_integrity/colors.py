"""
Formatadores visuais e cores ANSI para saída do terminal.
"""

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def log_header(title: str):
    print(f"\n{BOLD}{CYAN}=== {title} ==={RESET}")


def log_success(msg: str):
    print(f"  {GREEN}✅ {msg}{RESET}")


def log_warning(msg: str):
    print(f"  {YELLOW}⚠️  {msg}{RESET}")


def log_error(msg: str):
    print(f"  {RED}❌ {msg}{RESET}")

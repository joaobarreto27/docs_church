"""
Conversor de Markdown para blocos da API do Notion.
"""

def markdown_to_blocks(md_text, max_blocks=100):
    """Converte texto Markdown em lista de blocos estruturados do Notion."""
    blocks = []
    lines = md_text.splitlines()
    in_code_block = False
    code_lines = []
    code_lang = "plain text"

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_lang = stripped.lstrip("`").strip() or "plain text"
                code_lines = []
            else:
                in_code_block = False
                blocks.append({
                    "object": "block",
                    "type": "code",
                    "code": {
                        "rich_text": [{"type": "text", "text": {"content": "\n".join(code_lines)[:2000]}}],
                        "language": code_lang.lower() if code_lang.lower() in [
                            "javascript", "typescript", "python", "html", "css", "json", "markdown", "sql", "bash"
                        ] else "plain text"
                    }
                })
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        if not stripped:
            continue

        if stripped.startswith("### "):
            blocks.append({
                "object": "block",
                "type": "heading_3",
                "heading_3": {"rich_text": [{"type": "text", "text": {"content": stripped[4:][:2000]}}]}
            })
        elif stripped.startswith("## "):
            blocks.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {"rich_text": [{"type": "text", "text": {"content": stripped[3:][:2000]}}]}
            })
        elif stripped.startswith("# "):
            blocks.append({
                "object": "block",
                "type": "heading_1",
                "heading_1": {"rich_text": [{"type": "text", "text": {"content": stripped[2:][:2000]}}]}
            })
        elif stripped.startswith("- [ ] "):
            blocks.append({
                "object": "block",
                "type": "to_do",
                "to_do": {
                    "rich_text": [{"type": "text", "text": {"content": stripped[6:][:2000]}}],
                    "checked": False
                }
            })
        elif stripped.startswith("- [x] ") or stripped.startswith("- [X] "):
            blocks.append({
                "object": "block",
                "type": "to_do",
                "to_do": {
                    "rich_text": [{"type": "text", "text": {"content": stripped[6:][:2000]}}],
                    "checked": True
                }
            })
        elif stripped.startswith("- ") or stripped.startswith("* "):
            blocks.append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": stripped[2:][:2000]}}]}
            })
        else:
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {"rich_text": [{"type": "text", "text": {"content": stripped[:2000]}}]}
            })

        if len(blocks) >= max_blocks:
            break

    return blocks

import pathlib, re

for path in pathlib.Path("app/survey").rglob("*.tsx"):
    text = path.read_text(encoding="utf-8")

    # Replace shading/hover
    new_text = text.replace("bg-gray-50", "bg-gray-100").replace("hover:bg-orange-50", "hover:bg-blue-50")

    # Add space if missing after </span>
    new_text = re.sub(r"</span>(\S)", r"</span> \1", new_text)

    if text != new_text:
        path.write_text(new_text, encoding="utf-8")
        print(f"✅ Updated {path}")
    else:
        print(f"Skipped {path} (no matches)")

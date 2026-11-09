"""
Creates a 1-click shortcut for Beam Diagnostics CAD Studio (.exe) on the user's Desktop.
"""
import os
from pathlib import Path

def create_shortcut():
    desktop = Path.home() / "Desktop"
    if not desktop.exists():
        print("Desktop directory not found.")
        return

    target_exe = Path(__file__).resolve().parent / "dist" / "win-unpacked" / "Beam Diagnostics CAD Studio.exe"
    working_dir = target_exe.parent
    shortcut_path = desktop / "Beam Diagnostics CAD Studio.lnk"

    vbs_script = f'''
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "{str(shortcut_path)}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "{str(target_exe)}"
oLink.WorkingDirectory = "{str(working_dir)}"
oLink.Description = "Beam Diagnostics CAD Studio - Structural SFD and BMD Analysis"
oLink.WindowStyle = 1
oLink.Save
'''
    vbs_path = Path(__file__).resolve().parent / "_temp_create_shortcut.vbs"
    with open(vbs_path, "w", encoding="utf-8") as f:
        f.write(vbs_script)

    os.system(f'cscript //nologo "{str(vbs_path)}"')
    if vbs_path.exists():
        vbs_path.unlink()

    print(f"Created standalone .exe desktop shortcut at: {shortcut_path}")

if __name__ == "__main__":
    create_shortcut()

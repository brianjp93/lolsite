"""loc.py

Count lines in all project files, excluding external libraries.

"""
import pathlib

EXTENSIONS = ["py", "js", "jsx", "html", "css"]

total = 0
for ext in EXTENSIONS:
    for f in pathlib.Path().glob(f"**/*.{ext}"):
        rpath = f.relative_to(pathlib.Path(__file__).parent)
        rpath_str = str(rpath)
        if not any(
            (
                "migrations" in rpath_str,
                "node_modules" in rpath_str,
                "react" in rpath_str and "build" in rpath_str,
                "lolsite" in rpath_str and "static" in rpath_str,
            )
        ):
            with open(f) as fdata:
                total += len(fdata.readlines())

print(f"LOC in Project: {total:,}")

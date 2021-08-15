"""lolsite/context_processors.py
"""
import os
from django.conf import settings
import requests
import logging

logger = logging.getLogger(__name__)

BASE_DIR = settings.BASE_DIR


def get_paths():
    base = os.path.join(BASE_DIR, "react", "build", "static")
    js_dir = os.path.join(base, "js")
    css_dir = os.path.join(base, "css")
    for f in os.listdir(js_dir):
        if f.endswith(".js"):
            js_path = os.path.join("js", f)
    for f in os.listdir(css_dir):
        if f.endswith(".css"):
            css_path = os.path.join("css", f)
    return js_path, css_path


def react_data_processor(request):
    logger.info({'settings.REACT_DEV': settings.REACT_DEV})
    if settings.REACT_DEV:
        ip = settings.REACT_URL

        logger.info(f'IP ADDRESS: {ip}')

        # get all the scripts from the react-dev server and load them into our base.html page
        r = requests.get(f"http://{ip}")
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(r.content, features="html.parser")
        scripts = []
        for sc in soup.find_all("script"):
            sc["src"] = f'http://{ip}/{sc["src"]}'
            scripts.append(str(sc))
        scripts = "".join(scripts)

        react_data = {
            "react_dev": {
                "scripts": scripts,
                "css": f"http://{ip}/static/css/bundle.css",
            }
        }
    else:
        react_data = {"react_data": {"js": [], "css": []}}
        try:
            base = os.path.join(BASE_DIR, "react", "build", "static")
            js_dir = os.path.join(base, "js")
            css_dir = os.path.join(base, "css")
            for f in os.listdir(js_dir):
                if f.endswith(".js"):
                    js_path = os.path.join("js", f)
                    react_data["react_data"]["js"].append(js_path)
            for f in os.listdir(css_dir):
                if f.endswith(".css"):
                    css_path = os.path.join("css", f)
                    react_data["react_data"]["css"].append(css_path)
        except Exception as e:
            print(e)
    return react_data


def version_processor(request):
    return {"app_version": settings.VERSION_STRING}

import os
from django.conf import settings
import socket

BASE_DIR = settings.BASE_DIR

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    return ip

def get_paths():
    base = os.path.join(BASE_DIR, 'react', 'build', 'static')
    js_dir = os.path.join(base, 'js')
    css_dir = os.path.join(base, 'css')
    for f in os.listdir(js_dir):
        if f.endswith('.js'):
            js_path = os.path.join('js', f)
    for f in os.listdir(css_dir):
        if f.endswith('.css'):
            css_path = os.path.join('css', f)
    return js_path, css_path

def react_data_processor(request):
    if settings.REACT_DEV:
        try:
            ip = get_ip()
        except:
            print('Could not find your ip address.  React components will only work on the local machine.')
            ip = 'localhost'
        react_data = {'react_dev': {'js': 'http://{}:3000/static/js/bundle.js'.format(ip), 'css': 'http://{}:3000/static/css/bundle.css'.format(ip)}}
    else:
        react_data = {'react_data': {'js': '', 'css': ''}}
        try:
            base = os.path.join(BASE_DIR, 'react', 'build', 'static')
            js_dir = os.path.join(base, 'js')
            css_dir = os.path.join(base, 'css')
            for f in os.listdir(js_dir):
                if f.endswith('.js'):
                    js_path = os.path.join('js', f)
                    react_data['react_data']['js'] = js_path
            for f in os.listdir(css_dir):
                if f.endswith('.css'):
                    css_path = os.path.join('css', f)
                    react_data['react_data']['css'] = css_path
        except Exception as e:
            print(e)
    return react_data

def version_processor(request):
    return {'app_version': settings.VERSION_STRING}
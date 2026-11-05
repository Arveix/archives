import subprocess
import sys
import os
import time
from pathlib import Path
import json
import re
import frontmatter
from datetime import datetime

FOLDER_PATH = os.path.expanduser("~/Obsidian Vault/")
GIT_REPO_DIR = "/Users/arveix/Desktop/arveix.cc/archives"
TARGET_FILE = 'public/articles.json'

articles_json_file_path = f'{GIT_REPO_DIR}/{TARGET_FILE}'

try:
    with open(articles_json_file_path, "r", encoding="utf-8") as f:
        all_articles = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    all_articles = {}

def get_active_app():
    applescript = '''
    try
        tell application "System Events" to get name of first application process whose frontmost is true
    on error
        return ""
    end try
    '''
    try:
        res = subprocess.run(['osascript', '-e', applescript], capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr.strip() if e.stderr else e}", file=sys.stderr)
        return None

def get_modified_files(file_timestamps):
    latest_file_timestamps = {f: f.stat().st_mtime for f in Path(FOLDER_PATH).rglob("*.md") if f.is_file()}

    modified_files = {file_name: last_mtime for file_name, last_mtime in latest_file_timestamps.items() if last_mtime != file_timestamps.get(file_name)}

    deleted_files = [file_name for file_name in file_timestamps if file_name not in latest_file_timestamps]

    return latest_file_timestamps, modified_files, deleted_files

def generate_slug(file_name):
        slug = file_name.lower().replace("'", "")
        return re.sub(r'[^a-z0-9]+', '-', slug).strip('-')

def update_archives(file_timestamps):
    file_timestamps, modified_files, deleted_files = get_modified_files(file_timestamps)

    if not modified_files and not deleted_files:
        print('No changes.')
        return file_timestamps

    for file_name in deleted_files:
        slug = generate_slug(file_name.stem)
        all_articles.pop(slug, None)

    for file_name in modified_files:
        post = frontmatter.load(file_name)

        slug = generate_slug(file_name.stem)
        
        if 'publish' in (post.metadata.get('tags') or []):
            publishDate = all_articles[slug]["publishDate"] if slug in all_articles else datetime.now().isoformat()

            all_articles[slug] = {
                "title": file_name.stem,
                "tags": [tag for tag in post.metadata.get('tags', []) if tag != 'publish'],
                "publishDate": publishDate,
                "content": post.content
            }
        else:
            all_articles.pop(slug, None)

    with open(articles_json_file_path, "w", encoding="utf-8") as f:
            json.dump(all_articles, f, indent=4, ensure_ascii=False)
    
    subprocess.run(["git", "-C", GIT_REPO_DIR, "add", TARGET_FILE], check=True)
    status_check = subprocess.run(["git", "-C", GIT_REPO_DIR, "status", "--porcelain", TARGET_FILE], check=True, capture_output=True, text=True)
    
    if status_check.stdout.strip():
        subprocess.run(["git", "-C", GIT_REPO_DIR, "commit", "-m", "Auto commit: updated articles"], check=True)
        subprocess.run(["git", "-C", GIT_REPO_DIR, "push"], check=True)
        print('Updated articles.json')

    return file_timestamps

target = "Obsidian"
was_active = False
start_time = None

last_update = time.time()
print('Start time: ', last_update, '\n')

file_timestamps = {f: f.stat().st_mtime for f in Path(FOLDER_PATH).rglob("*.md") if f.is_file()}

was_active = False

while True:
    current_app = get_active_app()

    is_active = current_app.lower() == target.lower() if current_app else False

    if is_active and (time.time() - last_update > 300):
        print('Obsidian is active. Looking for file changes.')
        was_active = True

        file_timestamps = update_archives(file_timestamps)
        last_update = time.time()
        print('Last update: ', last_update)

    elif not is_active and was_active:
        file_timestamps = update_archives(file_timestamps)
        last_update = time.time()
        print('Last update: ', last_update)
        
        was_active = False
        print('Obsidian is now inactive.\n')
        
    time.sleep(1)

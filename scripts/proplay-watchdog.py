#!/usr/bin/env python3
"""External watchdog for ProPlayNews, run by cron on the VM every 2 minutes:

    */2 * * * * /usr/bin/python3 /root/cmmv-blog/scripts/proplay-watchdog.py

Lives outside the API on purpose: when the API is down (or up but failing every
DB query, as in the 46h outage of Sept/2026) it cannot report itself.

Alerts go to the Discord webhooks in apps/api/.env (DISCORD_WEBHOOK_PROPLAY for
the site, DISCORD_WEBHOOK_INFRA for disk). Only state changes are reported:
down after FAIL_THRESHOLD consecutive failures, a reminder every REMIND_MINUTES
while still down, recovery with the downtime, systemd auto-restarts, and disk
usage over DISK_WARN_PERCENT once per day.
"""
import json
import os
import shutil
import subprocess
import time
import urllib.request
from datetime import datetime

ROOT = '/root/cmmv-blog'
ENV_FILE = os.path.join(ROOT, 'apps/api/.env')
API_LOG = '/var/log/proplaynews-api.log'
STATE_FILE = '/var/lib/proplay-watchdog/state.json'
UNITS = ['proplaynews-api', 'proplaynews-web']

FAIL_THRESHOLD = 2
REMIND_MINUTES = 60
DISK_WARN_PERCENT = 90
TIMEOUT = 20

RED, GREEN, YELLOW = 0xED4245, 0x57F287, 0xFEE75C


def read_env():
    env = {}
    try:
        with open(ENV_FILE, encoding='utf-8') as fh:
            for line in fh:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env[key.strip()] = value.strip().strip('"').strip("'")
    except OSError:
        pass
    return env


def notify(webhook, title, description, color):
    if not webhook:
        return
    body = json.dumps({
        'username': 'Watchdog',
        'embeds': [{
            'title': title[:256],
            'description': description[:4000],
            'color': color,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        }],
    }).encode()
    req = urllib.request.Request(webhook, data=body, method='POST', headers={
        'Content-Type': 'application/json',
        'User-Agent': 'proplay-watchdog/1.0',
    })
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as exc:  # an alert failing must not crash the watchdog
        print(f'[watchdog] discord failed: {exc}')


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'proplay-watchdog/1.0'})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return resp.status, resp.read(200000).decode('utf-8', 'replace')


def check_site():
    status, _ = fetch(f'https://proplaynews.com.br/?wd={int(time.time())}')
    if status != 200:
        raise RuntimeError(f'HTTP {status}')


def check_api_db():
    # Public posts list: exercises API + database, not just the process being alive.
    status, body = fetch('http://127.0.0.1:5000/blog/posts/public?limit=1')
    if status != 200:
        raise RuntimeError(f'HTTP {status}')
    if '"posts":[{' not in body:
        raise RuntimeError(f'resposta sem posts: {body[:200]}')


CHECKS = {
    'site': ('Site (proplaynews.com.br)', check_site),
    'api_db': ('API + banco de dados', check_api_db),
}


def load_state():
    try:
        with open(STATE_FILE, encoding='utf-8') as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    tmp = STATE_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(state, fh)
    os.replace(tmp, STATE_FILE)


def minutes(seconds):
    m = int(seconds // 60)
    return f'{m // 60}h{m % 60:02d}min' if m >= 60 else f'{m}min'


def last_log_lines(n=4):
    try:
        out = subprocess.run(['tail', '-n', str(n), API_LOG], capture_output=True, text=True, timeout=5).stdout
        return '\n'.join(line[:250] for line in out.splitlines())
    except Exception:
        return ''


def run_checks(state, webhook, now):
    checks_state = state.setdefault('checks', {})
    for key, (label, fn) in CHECKS.items():
        st = checks_state.setdefault(key, {'fails': 0, 'first_fail': None, 'alerted_at': None})
        try:
            fn()
            ok, error = True, ''
        except Exception as exc:
            ok, error = False, str(exc)[:300]

        if ok:
            if st['alerted_at']:
                notify(webhook, f'✅ {label} voltou',
                       f'Ficou fora por {minutes(now - st["first_fail"])}.', GREEN)
            checks_state[key] = {'fails': 0, 'first_fail': None, 'alerted_at': None}
            continue

        st['fails'] += 1
        st['first_fail'] = st['first_fail'] or now
        if st['fails'] == FAIL_THRESHOLD:
            logs = last_log_lines() if key == 'api_db' else ''
            detail = f'Erro: `{error}`' + (f'\n\nÚltimas linhas do log da API:\n```\n{logs}\n```' if logs else '')
            notify(webhook, f'🔴 {label} fora do ar', detail, RED)
            st['alerted_at'] = now
        elif st['alerted_at'] and now - st['alerted_at'] >= REMIND_MINUTES * 60:
            notify(webhook, f'🔴 {label} continua fora do ar',
                   f'Há {minutes(now - st["first_fail"])}. Erro: `{error}`', RED)
            st['alerted_at'] = now


def check_restarts(state, webhook):
    restarts = state.setdefault('restarts', {})
    for unit in UNITS:
        try:
            out = subprocess.run(['systemctl', 'show', '-p', 'NRestarts', '--value', unit],
                                 capture_output=True, text=True, timeout=10).stdout.strip()
            count = int(out or 0)
        except Exception:
            continue
        previous = restarts.get(unit)
        # NRestarts resets when the unit is restarted by hand; only count increases.
        if previous is not None and count > previous:
            logs = last_log_lines(6) if unit == 'proplaynews-api' else ''
            notify(webhook, f'🟡 {unit} caiu e o systemd reiniciou',
                   f'{count - previous} reinício(s) automático(s) desde a última checagem.'
                   + (f'\n```\n{logs}\n```' if logs else ''), YELLOW)
        restarts[unit] = count


def check_disk(state, webhook):
    usage = shutil.disk_usage('/')
    percent = round(usage.used / usage.total * 100)
    today = datetime.now().strftime('%Y-%m-%d')
    if percent >= DISK_WARN_PERCENT and state.get('disk_alert_day') != today:
        notify(webhook, f'💾 Disco da VM ProPlay em {percent}%',
               f'Livre: {usage.free // (1024 ** 3)} GB de {usage.total // (1024 ** 3)} GB.', YELLOW)
        state['disk_alert_day'] = today


def main():
    env = read_env()
    state = load_state()
    now = time.time()
    run_checks(state, env.get('DISCORD_WEBHOOK_PROPLAY'), now)
    check_restarts(state, env.get('DISCORD_WEBHOOK_PROPLAY'))
    check_disk(state, env.get('DISCORD_WEBHOOK_INFRA'))
    save_state(state)


if __name__ == '__main__':
    main()

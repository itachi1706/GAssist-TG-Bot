# GAssistant-TG_Bot
---

[![GitHub license](https://img.shields.io/github/license/itachi1706/CheesecakeUtilities.svg)](https://github.com/itachi1706/GAssist-TG-Bot/blob/master/LICENSE)


A Telegram bot for the Google Assistant

This is a WIP and nothing is really set in stone yet lol


# How to setup
1. Create or open a project in the [Actions Console](http://console.actions.google.com)
2. Follow the instructions to [register a device model](https://developers.google.com/assistant/sdk/guides/service/python/embed/register-device)
  3. Download `credentials.json`
4. Install the [`google-oauthlib-tool`](https://github.com/GoogleCloudPlatform/google-auth-library-python-oauthlib) in a [Python 3](https://www.python.org/downloads/) virtual environment:

```
python3 -m venv env
env/bin/python -m pip install --upgrade pip setuptools
env/bin/pip install --upgrade "google-auth-oauthlib[tool]"
```
5. Use the [`google-oauthlib-tool`](https://github.com/GoogleCloudPlatform/google-auth-library-python-oauthlib) to generate credentials:

```
env/bin/google-oauthlib-tool --client-secrets credentials.json --scope https://www.googleapis.com/auth/assistant-sdk-prototype --save --headless
```
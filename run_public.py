import os
from pyngrok import conf, ngrok
from app import app

# Put your Ngrok authtoken in .env as NGROK_AUTHTOKEN=...
# You can also replace the placeholder below for the SkillWallet tutorial.
TOKEN = os.getenv("NGROK_AUTHTOKEN", "YOUR_NGROK_AUTHTOKEN")

if TOKEN and TOKEN != "YOUR_NGROK_AUTHTOKEN":
    ngrok.set_auth_token(TOKEN)

NGROK_PATH = os.getenv("NGROK_PATH")
PYNGROK_CONFIG = conf.PyngrokConfig(ngrok_path=NGROK_PATH) if NGROK_PATH else None

PORT = 5090
tunnel = ngrok.connect(PORT, "http", pyngrok_config=PYNGROK_CONFIG)
public_url = tunnel.public_url

print("\n" + "=" * 60)
print("YOUR PUBLIC WEBSITE URL IS LIVE!")
print("URL:", public_url)
print("=" * 60 + "\n")

app.run(host="0.0.0.0", port=PORT, debug=False, use_reloader=False)

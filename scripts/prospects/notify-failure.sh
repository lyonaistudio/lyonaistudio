#!/bin/bash
# Appelé par systemd (OnFailure=) quand la recherche quotidienne de prospects
# échoue : envoie une alerte Telegram, pour ne plus avoir de panne silencieuse.
ROOT="/home/thomasbatpro/lyon-ia-studio"
TOKEN=$(tr -d '[:space:]' < "$ROOT/cletelegram.txt")
CHAT_ID="6426805636"
LAST=$(tail -n 5 "$ROOT/commercial/prospects-cron.log" 2>/dev/null | cut -c1-300)
TEXT="⚠️ Recherche de prospects en échec ($(date '+%d/%m %H:%M')).
Dernières lignes du log :
${LAST:-(log vide)}"
curl -s -m 20 "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT_ID}" --data-urlencode "text=${TEXT}" > /dev/null

#!/bin/bash

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Usage: $0 <domain>"
  exit 1
fi

sudo certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN"
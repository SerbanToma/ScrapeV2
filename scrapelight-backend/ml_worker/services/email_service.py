from typing import List, Dict
import jinja2
import requests
from dotenv import load_dotenv
import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from shared.config import settings
from logging import getLogger

logger = getLogger(__name__)


class EmailService:
    def __init__(self):
        self._API_KEY = settings.MAILJET_API_KEY
        self._API_SECRET = settings.MAILJET_SECRET_KEY
        self._base_url = "https://api.mailjet.com/v3.1/send"
        self.template_loader = jinja2.FileSystemLoader(searchpath=settings.templates_dir)
        self.template_env = jinja2.Environment(loader=self.template_loader)

    @property
    def api_key(self):
        logger.info(f"api_key is {self._API_KEY}")
        return self._API_KEY

    @property
    def api_secret(self):
        logger.info(f"api_key is {self._API_SECRET}")
        return self._API_SECRET

    def render_template(self, template_filename, **context):
        return self.template_env.get_template(template_filename).render(**context)

    def send_simple_email(self, to, name, subject, text, html) -> Dict:
        payload = {
            "Messages": [
                {
                    "From": {
                        "Email": "serbaneltoma@gmail.com",
                        "Name": "Scrapelight team"
                    },
                    "To": [
                        {
                            "Email": to,
                            "Name": name
                        }
                    ],
                    "Subject": subject,
                    "TextPart": text,
                    "HTMLPart": html
                }
            ]
        }

        try:
            response = requests.post(
                self._base_url,
                auth=(self.api_key, self.api_secret),
                headers={
                    "Content-Type": "application/json"
                },
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error sending email: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response content: {e.response.text}")
            raise


    def send_multiple_emails(self, messages: List[Dict]) -> Dict:
        try:
            response = requests.post(
                self._base_url,
                auth=(self.api_key, self.api_secret),
                headers={
                    "Content-Type": "application/json"
                },
                json={
                    "Messages": messages
                }
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error sending emails: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response content: {e.response.text}")
            raise


    def send_registration_email(self, username: str, email: str):
        return self.send_simple_email(
            to=email,
            name=username,
            subject=f"Welcome to Scrapelight, {username}!",
            text=f"Hello, {username}! Welcome to Scrapelight! Get ready to unleash the number one AI-powered lightning search engine",
            html=self.render_template('email/action.html', username=username)
        )

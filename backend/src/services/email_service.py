import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from src.config import get_settings

logger = logging.getLogger("algotradex.email")

class EmailService:
    def __init__(self):
        self.settings = get_settings()

    @property
    def is_configured(self) -> bool:
        return bool(self.settings.smtp_host and self.settings.smtp_user and self.settings.smtp_password)

    def send_otp(self, to_email: str, otp_code: str, purpose: str = "registration") -> bool:
        """
        Sends an email OTP using configured SMTP server.
        If SMTP is not configured, logs a clear warning without pretending email was sent.
        """
        subject = "AlgoTradeX — Your Verification Code" if purpose == "registration" else "AlgoTradeX — Password Reset Code"
        purpose_label = "account registration" if purpose == "registration" else "password reset"

        text_content = f"""Hello,

Your AlgoTradeX single-use verification code for {purpose_label} is:

{otp_code}

This code will expire in {self.settings.otp_expire_minutes} minutes.
If you did not request this verification code, please ignore this email.

— AlgoTradeX Algorithmic Trading Simulator
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07111f; color: #e2e8f0; margin: 0; padding: 24px; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #0c1829; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }}
    .brand {{ font-size: 20px; font-weight: bold; color: #22d3ee; letter-spacing: -0.5px; margin-bottom: 20px; }}
    .badge {{ display: inline-block; background: rgba(34, 211, 238, 0.1); color: #22d3ee; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }}
    .code-box {{ background: #07111f; border: 1px solid #22d3ee40; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
    .code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #22d3ee; font-family: monospace; }}
    .footer {{ font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.6; border-top: 1px solid #1e293b; pt: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">⚡ AlgoTradeX</div>
    <div class="badge">{purpose_label}</div>
    <h2 style="margin: 0 0 12px 0; color: #f8fafc; font-size: 20px;">Verification Code</h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
      Use the following single-use verification code to complete your {purpose_label}.
    </p>
    <div class="code-box">
      <div class="code">{otp_code}</div>
    </div>
    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
      ⏰ This code expires in <strong>{self.settings.otp_expire_minutes} minutes</strong> and can only be used once.
    </p>
    <div class="footer">
      If you did not request this code, no action is required.<br>
      AlgoTradeX — Educational Algorithmic Trading Simulator
    </div>
  </div>
</body>
</html>"""

        if not self.is_configured:
            logger.warning(
                f"[EMAIL SERVICE] SMTP not configured (SMTP_HOST/SMTP_USER missing). "
                f"Generated OTP for {to_email}: {otp_code} (Purpose: {purpose}). "
                f"Configure SMTP in backend/.env for live email delivery."
            )
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.settings.smtp_from_name} <{self.settings.smtp_from_email}>"
            msg["To"] = to_email

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if self.settings.smtp_tls:
                with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=10) as server:
                    server.starttls()
                    server.login(self.settings.smtp_user, self.settings.smtp_password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP_SSL(self.settings.smtp_host, self.settings.smtp_port, timeout=10) as server:
                    server.login(self.settings.smtp_user, self.settings.smtp_password)
                    server.send_message(msg)

            logger.info(f"Verification email successfully dispatched to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email} via SMTP: {e}")
            return False

email_service = EmailService()

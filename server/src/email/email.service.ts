import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

export interface AssignmentEmailInput {
  toEmail: string
  title: string
  description: string
  assignerEmail: string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly resend: Resend
  private readonly fromEmail: string

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'))
    this.fromEmail = config.getOrThrow<string>('RESEND_FROM_EMAIL')
  }

  async sendAssignmentNotification(input: AssignmentEmailInput): Promise<void> {
    const html = renderAssignmentEmail(input)
    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: input.toEmail,
      subject: `${input.assignerEmail} assigned you a task: ${input.title}`,
      html,
    })
    if (error) {
      this.logger.error(`Failed to send assignment email to ${input.toEmail}: ${error.message}`)
      throw new Error(error.message)
    }
  }
}

// Minimal on-brand (Pip-Boy phosphor-green) HTML email. Kept inline —
// no template engine needed for one email.
function renderAssignmentEmail({ title, description, assignerEmail }: AssignmentEmailInput): string {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description || '(no description)')
  const safeAssigner = escapeHtml(assignerEmail)
  return `
    <div style="background:#070b07;padding:32px;font-family:ui-monospace,Consolas,monospace;">
      <div style="max-width:480px;margin:0 auto;background:#0c120c;border:1px solid #1a2c1a;border-radius:8px;padding:24px;">
        <div style="color:#2bff88;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px;">
          ▌ New Mission Assigned
        </div>
        <div style="color:#b8f5c8;font-size:18px;font-weight:700;margin-bottom:8px;">${safeTitle}</div>
        <div style="color:#5fa873;font-size:13px;line-height:1.6;margin-bottom:20px;white-space:pre-wrap;">${safeDescription}</div>
        <div style="color:#3c6b48;font-size:11px;border-top:1px solid #1a2c1a;padding-top:14px;">
          Assigned by ${safeAssigner}
        </div>
        <a href="https://missions.laertleba.com" style="display:inline-block;margin-top:18px;background:#2bff88;color:#06140b;text-decoration:none;font-size:12px;font-weight:700;padding:10px 18px;border-radius:4px;">
          Open Missions
        </a>
      </div>
    </div>
  `.trim()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

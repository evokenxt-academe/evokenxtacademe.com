import { BrevoClient } from '@getbrevo/brevo';

const brevo = new BrevoClient({ apiKey: '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' });

interface sendMailParams {
    subject: string
    meta: {
        title: string
        description?: string,
        button_label?: string,
        button_href?: string,
    },
    to: {
        email: string,
        name: string,
    }
}
export async function sendEmail({ subject, meta, to }: sendMailParams): Promise<{ success: boolean; data: string }> {
    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            subject,
            htmlContent: `<html><body><p>Hello,</p><p>${meta.title}</p></body></html>`,
            sender: { name: 'Fellow Notes', email: 'otp.providers@gmail.com' },
            to: [{ email: to.email, name: to.name }],
        });
        return {
            success: true,
            data: result.messageId!
        };
    } catch (error) {
        return {
            success: false,
            data: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }

}

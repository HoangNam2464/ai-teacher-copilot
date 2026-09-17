package com.aiteachercopilot.common.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.util.Optional;

/**
 * Service for sending HTML transactional emails (Verification, Password Reset).
 * Supports SMTP (Gmail, SendGrid, Amazon SES, etc.) with safe local/dev fallback logging.
 */
@Slf4j
@Service
public class EmailService {

    private final Optional<JavaMailSender> mailSender;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@aiteachercopilot.com}")
    private String fromEmail;

    @Value("${app.mail.sender-name:AI Teacher Copilot}")
    private String senderName;

    @Autowired
    public EmailService(Optional<JavaMailSender> mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send account verification email to newly registered teacher.
     */
    @Async
    public void sendVerificationEmail(String toEmail, String fullName, String verificationUrl) {
        log.info("Preparing verification email for: {} [URL: {}]", toEmail, verificationUrl);

        if (!mailEnabled || mailSender.isEmpty()) {
            log.info("Email service disabled or MailSender bean absent. VERIFICATION LINK for [{}]: {}", toEmail, verificationUrl);
            return;
        }

        String subject = "Kích hoạt tài khoản Giáo viên — AI Teacher Copilot";
        String htmlContent = buildVerificationEmailTemplate(fullName, verificationUrl);

        sendHtmlEmail(toEmail, subject, htmlContent, verificationUrl);
    }

    /**
     * Send password reset email with secure token link.
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String fullName, String resetUrl) {
        log.info("Preparing password reset email for: {} [URL: {}]", toEmail, resetUrl);

        if (!mailEnabled || mailSender.isEmpty()) {
            log.info("Email service disabled or MailSender bean absent. PASSWORD RESET LINK for [{}]: {}", toEmail, resetUrl);
            return;
        }

        String subject = "Yêu cầu đặt lại mật khẩu — AI Teacher Copilot";
        String htmlContent = buildPasswordResetEmailTemplate(fullName, resetUrl);

        sendHtmlEmail(toEmail, subject, htmlContent, resetUrl);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent, String fallbackUrl) {
        try {
            JavaMailSender sender = mailSender.orElseThrow();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, senderName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            sender.send(message);
            log.info("Successfully sent email '{}' to {}", subject, toEmail);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email to {}. Fallback Link: {}", toEmail, fallbackUrl, e);
        } catch (Exception e) {
            log.warn("SMTP connection failed or unconfigured when sending to {}. Fallback Link: {} (Error: {})",
                    toEmail, fallbackUrl, e.getMessage());
        }
    }

    private String buildVerificationEmailTemplate(String fullName, String verificationUrl) {
        String displayName = (fullName != null && !fullName.isBlank()) ? fullName : "Thầy/Cô";
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Kích hoạt tài khoản</title>
                <style>
                    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
                    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
                    .header h1 { margin: 12px 0 0 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                    .content { padding: 36px 32px; color: #334155; line-height: 1.6; }
                    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
                    .button-container { text-align: center; margin: 32px 0; }
                    .btn-activate { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff !important; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.3); }
                    .link-box { background-color: #f1f5f9; padding: 14px; border-radius: 8px; font-size: 12px; word-break: break-all; color: #64748b; margin-top: 24px; border: 1px dashed #cbd5e1; }
                    .footer { padding: 24px 32px; background-color: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div style="font-size: 32px;">🎓</div>
                        <h1>AI Teacher Copilot</h1>
                        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Trợ Lý AI Giáo Án & Đề Thi K-12</p>
                    </div>
                    <div class="content">
                        <div class="greeting">Kính chào Thầy/Cô {{displayName}},</div>
                        <p>Cảm ơn Thầy/Cô đã đăng ký tài khoản tại nền tảng <strong>AI Teacher Copilot</strong>.</p>
                        <p>Để bảo vệ an toàn thông tin và bắt đầu sử dụng các tính năng soạn giáo án, tạo ma trận đề thi chuẩn RAG AI, vui lòng bấm vào nút bên dưới để kích hoạt tài khoản của mình:</p>
                        
                        <div class="button-container">
                            <a href="{{verificationUrl}}" target="_blank" class="btn-activate">Kích Hoạt Tài Khoản Ngay</a>
                        </div>
                        
                        <p style="font-size: 13px; color: #64748b;">
                            * Liên kết kích hoạt này có hiệu lực trong vòng <strong>24 giờ</strong>.<br>
                            * Nếu Thầy/Cô không yêu cầu đăng ký tài khoản này, vui lòng bỏ qua email.
                        </p>

                        <div class="link-box">
                            Nếu nút trên không mở được, Thầy/Cô có thể sao chép liên kết này vào trình duyệt:<br>
                            <a href="{{verificationUrl}}" style="color: #059669; text-decoration: underline;">{{verificationUrl}}</a>
                        </div>
                    </div>
                    <div class="footer">
                        © 2026 AI Teacher Copilot for K-12 Teachers. All rights reserved.<br>
                        Hệ thống tự động — vui lòng không trả lời email này.
                    </div>
                </div>
            </body>
            </html>
            """
            .replace("{{displayName}}", displayName)
            .replace("{{verificationUrl}}", verificationUrl);
    }

    private String buildPasswordResetEmailTemplate(String fullName, String resetUrl) {
        String displayName = (fullName != null && !fullName.isBlank()) ? fullName : "Thầy/Cô";
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Đặt lại mật khẩu</title>
                <style>
                    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
                    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
                    .content { padding: 36px 32px; color: #334155; line-height: 1.6; }
                    .btn-reset { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff !important; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.3); }
                    .footer { padding: 24px 32px; background-color: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div style="font-size: 32px;">🔒</div>
                        <h1 style="margin: 12px 0 0 0; font-size: 24px;">Đặt Lại Mật Khẩu</h1>
                    </div>
                    <div class="content">
                        <p>Kính chào Thầy/Cô <strong>{{displayName}}</strong>,</p>
                        <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản AI Teacher Copilot của Thầy/Cô. Vui lòng bấm nút bên dưới để tạo mật khẩu mới:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{resetUrl}}" target="_blank" class="btn-reset">Đặt Lại Mật Khẩu</a>
                        </div>
                        <p style="font-size: 13px; color: #64748b;">
                            Liên kết này có hiệu lực trong vòng <strong>60 phút</strong>. Nếu Thầy/Cô không thực hiện yêu cầu này, vui lòng bỏ qua email.
                        </p>
                    </div>
                    <div class="footer">
                        © 2026 AI Teacher Copilot for K-12 Teachers.
                    </div>
                </div>
            </body>
            </html>
            """
            .replace("{{displayName}}", displayName)
            .replace("{{resetUrl}}", resetUrl);
    }
}

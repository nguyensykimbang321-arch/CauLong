import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true cho cổng 465, false cho cổng khác như 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Gửi email chứa mật khẩu tạm thời cho người dùng
 * @param toEmail Địa chỉ email nhận thư
 * @param tempPassword Mật khẩu tạm thời
 */
export async function sendTemporaryPasswordEmail(toEmail: string, tempPassword: string): Promise<void> {
    const mailOptions = {
        from: `"Hệ thống Sân Cầu Lông" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Khôi phục mật khẩu - Mật khẩu tạm thời mới',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 40px;">🏸</span>
                    <h2 style="color: #1a365d; margin-top: 10px; font-weight: 700;">HỆ THỐNG ĐẶT SÂN CẦU LÔNG</h2>
                </div>
                
                <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">Xin chào,</p>
                
                <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                    Chúng tôi đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản liên kết với địa chỉ email này.
                </p>
                
                <div style="background-color: #f7fafc; border: 2px dashed #cbd5e0; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px;">
                    <p style="font-size: 14px; color: #718096; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Mật khẩu tạm thời của bạn</p>
                    <span style="font-size: 24px; font-weight: 700; color: #2b6cb0; letter-spacing: 1.5px;">${tempPassword}</span>
                </div>
                
                <div style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="font-size: 14px; color: #dd6b20; font-weight: bold; margin: 0 0 5px 0;">Lưu ý quan trọng:</p>
                    <ul style="font-size: 14px; color: #7b341e; margin: 0; padding-left: 20px;">
                        <li>Vui lòng sử dụng mật khẩu này để đăng nhập lại vào ứng dụng di động.</li>
                        <li>Sau khi đăng nhập thành công, bạn hãy truy cập cài đặt để <strong>Đổi mật khẩu mới</strong> nhằm tăng tính bảo mật.</li>
                    </ul>
                </div>
                
                <p style="font-size: 14px; color: #718096; line-height: 1.6; margin-top: 30px;">
                    Nếu bạn không yêu cầu hành động này, vui lòng đổi mật khẩu tài khoản của bạn hoặc liên hệ bộ phận CSKH của chúng tôi để được trợ giúp.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 25px 0;" />
                
                <p style="font-size: 11px; color: #a0aec0; text-align: center; margin: 0;">
                    Đây là thư tự động từ hệ thống đặt sân. Vui lòng không phản hồi trực tiếp thư này.
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

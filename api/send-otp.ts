
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Initialize Supabase for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // Always set content-type to application/json
  res.setHeader('Content-Type', 'application/json');

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Basic email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'A valid email identity is required.' });
  }

  try {
    // Check required ENV variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("Missing SMTP Configuration Env Vars");
      return res.status(500).json({ success: false, error: 'Server configuration error: SMTP variables missing.' });
    }

    // 1. Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity

    // 2. Persist OTP in Supabase 'otps' table
    try {
      const { error: dbError } = await supabase
        .from('otps')
        .upsert({ 
          email, 
          code_hash: hashedOtp, 
          expires_at: expiresAt,
          attempts: 0 
        }, { onConflict: 'email' });

      if (dbError) throw new Error(`Database Error: ${dbError.message}`);
    } catch (e: any) {
      console.error("Supabase OTP storage failure:", e.message);
      return res.status(500).json({ success: false, error: 'Verification system database failure.' });
    }

    // 3. Configure Nodemailer
    // Fix: Cast the configuration object to 'any' to bypass strict type checking for Nodemailer's multiple createTransport overloads
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      timeout: 10000, // 10 second timeout for serverless
    } as any);

    // 4. Send the verification email
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
    
    try {
      await transporter.sendMail({
        from: `"Fresh Cut Support" <${fromEmail}>`,
        to: email,
        subject: "Your Fresh Cut Verification Code",
        text: `Your Fresh Cut verification OTP is ${otp}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; background-color: #0A0A0A; color: #FFFFFF; border: 1px solid #D4AF37; border-radius: 20px;">
            <h1 style="color: #D4AF37; text-align: center; font-size: 24px; text-transform: uppercase; letter-spacing: 4px;">Fresh Cut</h1>
            <p style="text-align: center; color: #AAAAAA; font-size: 14px; margin-top: 20px;">SECURITY VERIFICATION CODE</p>
            <div style="background: rgba(212, 175, 55, 0.1); padding: 30px; border-radius: 15px; text-align: center; border: 1px dashed #D4AF37; margin: 30px 0;">
              <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #D4AF37;">${otp}</span>
            </div>
            <p style="text-align: center; font-size: 12px; color: #666666;">
              This security code expires in 5 minutes.<br/>
              If you did not request this, please ignore this email.
            </p>
          </div>
        `,
      });
    } catch (e: any) {
      console.error("Nodemailer transmission failure:", e.message);
      return res.status(503).json({ success: false, error: 'Email delivery service currently unavailable.' });
    }

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Final Catch Error:', error.message);
    return res.status(500).json({ success: false, error: `Backend Exception: ${error.message}` });
  }
}

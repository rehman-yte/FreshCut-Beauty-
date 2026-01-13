import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and verification code are required.' });
  }

  try {
    // 1. Fetch the stored OTP record
    const { data: record, error: fetchError } = await supabase
      .from('otps')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !record) {
      return res.status(400).json({ success: false, error: 'No active verification session found for this identity.' });
    }

    // 2. Check for too many failed attempts
    if (record.attempts >= 3) {
      return res.status(403).json({ success: false, error: 'Max verification attempts exceeded. Request a new code.' });
    }

    // 3. Check for expiration
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ success: false, error: 'The verification code has expired.' });
    }

    // 4. Verify hashed OTP
    const hashedInput = crypto.createHash('sha256').update(otp).digest('hex');
    
    if (hashedInput === record.code_hash) {
      // Success: Clear record
      await supabase.from('otps').delete().eq('email', email);
      return res.status(200).json({ success: true, verified: true });
    } else {
      // Failure: Track attempts
      await supabase
        .from('otps')
        .update({ attempts: record.attempts + 1 })
        .eq('email', email);
      
      return res.status(400).json({ 
        success: false,
        error: 'Incorrect verification code.', 
        remaining: 3 - (record.attempts + 1) 
      });
    }
  } catch (error: any) {
    console.error('OTP Verification Exception:', error);
    return res.status(500).json({ success: false, error: `Internal verification exception: ${error.message}` });
  }
}
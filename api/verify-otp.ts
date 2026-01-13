
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Mobile and OTP required' });
  }

  try {
    // Basic validation: OTP must be 6 digits
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      return res.status(200).json({ 
        success: true,
        message: 'Verification successful'
      });
    }

    return res.status(400).json({ 
      success: false, 
      error: 'Invalid verification code format.' 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during verification' });
  }
}

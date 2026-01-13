
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { mobile } = req.body;

  if (!mobile || mobile.length < 10) {
    return res.status(400).json({ error: 'Valid mobile number required' });
  }

  try {
    // Generate a simple 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In a production environment, you would store this in a database/cache with an expiry.
    // For this simple stable implementation, we return it directly for the dev-mode popup.
    return res.status(200).json({ 
      success: true, 
      otp,
      message: 'OTP issued successfully.' 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during OTP generation' });
  }
}

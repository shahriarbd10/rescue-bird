export function otpMailTemplate(name: string, code: string) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 20px;">
    <h2 style="margin-bottom: 8px;">Welcome to Rescue Bird</h2>
    <p>Hi ${name},</p>
    <p>Your OTP code is:</p>
    <p style="font-size: 30px; letter-spacing: 6px; font-weight: bold; color: #0b3d91;">${code}</p>
    <p>This code expires in 10 minutes.</p>
  </div>
  `;
}

export function greetingMailTemplate(name: string, role: string) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 20px;">
    <h2 style="margin-bottom: 8px;">Account verified</h2>
    <p>Hi ${name},</p>
    <p>Your Rescue Bird account is now active as <strong>${role}</strong>.</p>
    <p>You can now log in and use emergency alerts, coverage assignment, and team messaging.</p>
  </div>
  `;
}

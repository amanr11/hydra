const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Centralized Gmail Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hydrabuddyteam@gmail.com',
    pass: 'pcqy uaqb dcat lzjv', 
  },
});

// Reusable function for the Auth Email
async function sendHydraVerification(email) {
  const link = await admin.auth().generateEmailVerificationLink(email, {
    url: 'https://hydra-a8bac.firebaseapp.com', 
    handleCodeInApp: true,
  });

  const mailOptions = {
    from: '"Hydra Team" <hydrabuddyteam@gmail.com>',
    to: email,
    subject: 'Welcome to Hydra! 💧 Verify Your Email',
    html: `
      <div style="font-family: sans-serif; background: #0A2540; color: white; padding: 40px; border-radius: 16px; text-align: center;">
        <h1 style="color: #6FE7DD; font-size: 40px;">hydra</h1>
        <p style="font-size: 18px;">Stay hydrated. Stay healthy.</p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
        <p>Click below to verify your account and start tracking:</p>
        <a href="${link}" style="background: #3ABEFF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; margin: 20px 0;">
          ✅ Verify My Email
        </a>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
}

// 1. Send welcome email when user signs up
exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
  return sendHydraVerification(user.email);
});

// 2. Custom Resend Trigger (triggered via Firestore)
exports.onResendRequested = functions.firestore
  .document('resendRequests/{userId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;
    const user = await admin.auth().getUser(context.params.userId);
    await sendHydraVerification(user.email);
    return change.after.ref.delete(); // Delete request after sending
  });

// 3. Send email when user completes goal (Updated to use Gmail)
exports.sendGoalCompletedEmail = functions.firestore
  .document('users/{userId}/dailyStats/{date}')
  .onWrite(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();
    
    if (after && after.goalCompleted && (!before || !before.goalCompleted)) {
      const userId = context.params.userId;
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData || !userData.email) return;
      
      const mailOptions = {
        from: '"Hydra Team" <hydrabuddyteam@gmail.com>',
        to: userData.email,
        subject: '🎉 Daily Goal Achieved!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
            <h1 style="color: #3ABEFF;">🏆 Congratulations!</h1>
            <p style="font-size: 18px;">You've reached your daily hydration goal!</p>
            <p>Keep up the amazing work! 💪</p>
            <p style="color: #666; font-size: 14px;">- The Hydra Team</p>
          </div>
        `,
      };
      
      try {
        await transporter.sendMail(mailOptions);
        console.log('Goal completed email sent to:', userData.email);
      } catch (error) {
        console.error('Error sending goal email:', error);
      }
    }
  });
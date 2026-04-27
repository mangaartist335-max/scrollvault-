import { Router } from 'express';
import auth from '../middleware/auth.js';
import supabase from '../db.js';
import paypal from '@paypal/payouts-sdk';

const router = Router();

const MIN_WITHDRAW = Number(process.env.MIN_WITHDRAW ?? 10);

// Setup PayPal Environment (Sandbox for now)
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// GET /api/balance
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('balances')
      .select('amount, updated_at')
      .eq('user_id', req.userId)
      .single();

    if (error) throw error;
    res.json({ balance: data?.amount ?? 0, updatedAt: data?.updated_at });
  } catch (err) {
    console.error('Balance fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/balance/reset
router.post('/reset', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('balances')
      .update({ amount: 0 })
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ balance: 0 });
  } catch (err) {
    console.error('Balance reset error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/balance/withdraw
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount, method, details } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    if (amount < MIN_WITHDRAW) {
      return res
        .status(400)
        .json({ error: `Minimum withdrawal is $${MIN_WITHDRAW.toFixed(2)}` });
    }

    // Fetch current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('balances')
      .select('amount')
      .eq('user_id', req.userId)
      .single();

    if (balanceError) throw balanceError;

    if (balanceData.amount < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    if (method === 'PayPal') {
      // Call PayPal Payouts API
      const request = new paypal.payouts.PayoutsPostRequest();
      request.requestBody({
        sender_batch_header: {
          recipient_type: "EMAIL",
          email_message: "ScrollVault Withdrawal - Your funds have arrived!",
          note: "Enjoy your ScrollVault rewards!",
          sender_batch_id: `sv_withdraw_${Date.now()}_${req.userId}`,
          email_subject: "You received a payment from ScrollVault!"
        },
        items: [{
          amount: {
            currency: "USD",
            value: amount.toString()
          },
          receiver: details, // This is the user's PayPal email they typed in
          note: `ScrollVault Cashout for $${amount}`
        }]
      });

      try {
        const response = await client.execute(request);
        console.log(`PayPal Payout successful. Batch ID: ${response.result.batch_header.payout_batch_id}`);
      } catch (paypalError) {
        console.error('PayPal Payout failed:', paypalError);
        // Important: If PayPal fails, don't deduct the user's balance
        const errorDetails = paypalError.message ? JSON.parse(paypalError.message) : { message: 'Unknown PayPal Error' };
        
        // Let's handle the specific "Authorization failed" error gracefully in the UI
        if (errorDetails.name === 'AUTHORIZATION_ERROR') {
             return res.status(400).json({ error: 'PayPal account needs Payouts permission. Check developer.paypal.com' });
        }
        
        return res.status(400).json({ error: 'PayPal transfer failed. Please check your email/account details.' });
      }
    }

    // If PayPal succeeds (or if it's another method we are simulating), deduct the balance
    const { error: updateError } = await supabase
      .from('balances')
      .update({ amount: balanceData.amount - amount })
      .eq('user_id', req.userId);

    if (updateError) throw updateError;

    res.json({ success: true, newBalance: balanceData.amount - amount });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;